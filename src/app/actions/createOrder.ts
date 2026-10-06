"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { auth } from "../../lib/auth";
import { transactionDb } from "../../lib/transaction-db";
import { categories, orderItems, orders, products, productImages, productVariants } from "../../lib/schema";
import { initializePaystackPayment } from "@/lib/paystack";
import { getReservationExpiry, releaseInventoryReservation } from "@/lib/inventory-reservations";
import { koboToNairaDecimal, parseNairaToKobo } from "@/lib/money";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(255),
  customerPhone: z.string().trim().min(5).max(30),
  idempotencyKey: z.string().uuid(),
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  country: z.literal("Nigeria"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        variantId: z.string().min(1).optional(),
        size: z.string().max(30).optional(),
        customizations: z.object({
          color: z.string().trim().max(80).optional(),
          desiredLength: z.string().trim().max(80).optional(),
          customerHeight: z.string().trim().max(80).optional(),
          notes: z.string().trim().max(500).optional(),
        }).optional(),
      }),
    )
    .min(1),
});

export type CheckoutResult =
  | { success: true; authorizationUrl: string }
  | { success: false; message: string };

function createSiteUrl(requestHeaders: Headers) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  if (!host) throw new Error("We could not determine the checkout address.");
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}

export async function createOrder(formData: FormData): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone") || undefined,
    idempotencyKey: formData.get("idempotencyKey"),
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    items: (() => {
      try {
        return JSON.parse(String(formData.get("items"))) as unknown;
      } catch {
        return null;
      }
    })(),
  });

  if (!parsed.success) {
    return { success: false, message: "Please complete all checkout fields. We currently deliver within Nigeria only." };
  }

  const productIds = [...new Set(parsed.data.items.map((item) => item.productId))];

  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    const result = await transactionDb.transaction(async (tx) => {
      const existingOrder = await tx.query.orders.findFirst({
        where: eq(orders.checkoutIdempotencyKey, parsed.data.idempotencyKey),
      });
      if (existingOrder) {
        const sameCustomer = existingOrder.customerEmail.toLowerCase() === parsed.data.customerEmail.toLowerCase() && (!session?.user.id || !existingOrder.userId || session.user.id === existingOrder.userId);
        if (!sameCustomer) throw new Error("This checkout key is not valid for the submitted customer.");
        if (existingOrder.paymentStatus === "pending" && existingOrder.reservationStatus === "active" && existingOrder.paymentAuthorizationUrl) {
          return { kind: "existing" as const, authorizationUrl: existingOrder.paymentAuthorizationUrl };
        }
        if (existingOrder.paymentStatus === "pending" && existingOrder.reservationStatus === "active") {
          throw new Error("Your payment is still being prepared. Please try again in a moment.");
        }
        throw new Error("This checkout is no longer active. Please return to your bag and start checkout again.");
      }

      const catalogProducts = await tx
        .select()
        .from(products)
        .where(
          and(inArray(products.id, productIds), eq(products.isActive, true)),
        );

      if (catalogProducts.length !== productIds.length) {
        throw new Error("One or more products are no longer available.");
      }
      const categoryIds = catalogProducts.map((product) => product.categoryId).filter((id): id is string => Boolean(id));
      const productCategories = categoryIds.length ? await tx.select().from(categories).where(inArray(categories.id, categoryIds)) : [];
      const categoryById = new Map(productCategories.map((category) => [category.id, category]));
      if (catalogProducts.some((product) => categoryById.get(product.categoryId || "")?.slug === "custom-traditional-wear")) {
        throw new Error("Custom pieces require an in-person fitting. Please use the WhatsApp enquiry button on the product page.");
      }

      const productsById = new Map(
        catalogProducts.map((product) => [product.id, product]),
      );
      const catalogVariants = await tx.select().from(productVariants).where(inArray(productVariants.productId, productIds));
      const variantsById = new Map(catalogVariants.map((variant) => [variant.id, variant]));
      const catalogImages = await tx.select().from(productImages).where(inArray(productImages.productId, productIds));
      const firstImageByProduct = new Map<string, string>();
      for (const image of catalogImages.sort((a, b) => a.displayOrder - b.displayOrder)) {
        if (!firstImageByProduct.has(image.productId)) firstImageByProduct.set(image.productId, image.imageUrl);
      }
      const lineItems = parsed.data.items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new Error("One or more products are no longer available.");
        }
        const variant = item.variantId ? variantsById.get(item.variantId) : undefined;
        if (product.inventoryMigrationStatus === "migrated") {
          if (!variant || variant.productId !== product.id || !variant.isActive || variant.size !== (item.size || "ONE_SIZE")) throw new Error(`${product.productName} does not have that available size.`);
        } else if (item.variantId || (item.size && product.sizes && !product.sizes.includes(item.size))) {
          throw new Error(`${product.productName} does not offer size ${item.size || "selected"}.`);
        }
        const quantity = item.quantity;
        const unitPriceKobo = parseNairaToKobo(product.price);
        if (unitPriceKobo <= BigInt(0)) throw new Error(`${product.productName} has an invalid price.`);
        return {
          product,
          variant,
          quantity,
          size: item.size,
          unitPriceKobo,
          totalPriceKobo: unitPriceKobo * BigInt(quantity),
          customizations: item.customizations,
        };
      });
      const legacyQuantities = new Map<string, number>();
      const variantQuantities = new Map<string, number>();
      for (const item of lineItems) {
        if (item.variant) variantQuantities.set(item.variant.id, (variantQuantities.get(item.variant.id) || 0) + item.quantity);
        else legacyQuantities.set(item.product.id, (legacyQuantities.get(item.product.id) || 0) + item.quantity);
      }
      for (const [variantId, quantity] of [...variantQuantities.entries()].sort(([left], [right]) => left.localeCompare(right))) {
        const variant = variantsById.get(variantId);
        const reserved = await tx.update(productVariants)
          .set({ inventoryCount: sql`${productVariants.inventoryCount} - ${quantity}`, updatedAt: new Date() })
          .where(and(eq(productVariants.id, variantId), eq(productVariants.isActive, true), sql`${productVariants.inventoryCount} >= ${quantity}`))
          .returning({ id: productVariants.id });
        if (reserved.length !== 1) throw new Error(`${variant?.size || "Selected size"} does not have enough stock.`);
      }
      for (const [productId, quantity] of [...legacyQuantities.entries()].sort(([left], [right]) => left.localeCompare(right))) {
        const product = productsById.get(productId);
        const reserved = await tx.update(products)
          .set({ inventoryCount: sql`coalesce(${products.inventoryCount}, 0) - ${quantity}`, updatedAt: new Date() })
          .where(and(eq(products.id, productId), eq(products.isActive, true), eq(products.inventoryMigrationStatus, "legacy"), sql`coalesce(${products.inventoryCount}, 0) >= ${quantity}`))
          .returning({ id: products.id });
        if (reserved.length !== 1) throw new Error(`${product?.productName || "A product"} does not have enough stock.`);
      }
      const totalKobo = lineItems.reduce(
        (total, item) => total + item.totalPriceKobo,
        BigInt(0),
      );
      if (totalKobo <= BigInt(0)) throw new Error("The order total must be greater than zero.");
      const orderNumber = `GS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const paymentReference = `GS-${crypto.randomUUID().replaceAll("-", "")}`;

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: session?.user.id,
          customerName: parsed.data.customerName,
          customerEmail: parsed.data.customerEmail,
          customerPhone: parsed.data.customerPhone || null,
          totalAmount: koboToNairaDecimal(totalKobo),
          shippingAddress: {
            street: parsed.data.street,
            city: parsed.data.city,
            state: parsed.data.state,
            postalCode: "",
            country: parsed.data.country,
          },
          checkoutIdempotencyKey: parsed.data.idempotencyKey,
          paymentIntentId: paymentReference,
          paymentStatus: "pending",
          reservationStatus: "active",
          reservationExpiresAt: getReservationExpiry(),
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber, paymentIntentId: orders.paymentIntentId, totalAmount: orders.totalAmount });

      await tx.insert(orderItems).values(
        lineItems.map(({ product, variant, quantity, size, unitPriceKobo, totalPriceKobo, customizations }) => ({
          orderId: order.id,
          productId: product.id,
          variantId: variant?.id || null,
          variantSku: variant?.sku || null,
          productName: product.productName,
          productImage: firstImageByProduct.get(product.id) || null,
          size: size || null,
          customizations: customizations || null,
          quantity,
          unitPrice: koboToNairaDecimal(unitPriceKobo),
          totalPrice: koboToNairaDecimal(totalPriceKobo),
        })),
      );

      return { kind: "new" as const, ...order, totalKobo };
    });
    if (result.kind === "existing") return { success: true, authorizationUrl: result.authorizationUrl };
    try {
      const payment = await initializePaystackPayment({
        email: parsed.data.customerEmail,
        amountKobo: result.totalKobo,
        reference: result.paymentIntentId!,
        // Paystack appends the transaction reference to this URL after payment.
        // Supplying our own query parameter here can create a malformed duplicate
        // reference for transfer redirects.
        callbackUrl: `${createSiteUrl(requestHeaders)}/checkout/verify`,
        orderId: result.id,
        orderNumber: result.orderNumber,
      });
      const savedAuthorization = await transactionDb.transaction(async (tx) => tx.update(orders)
        .set({ paymentAuthorizationUrl: payment.authorization_url, updatedAt: new Date() })
        .where(and(eq(orders.id, result.id), eq(orders.paymentStatus, "pending"), eq(orders.reservationStatus, "active"), isNull(orders.paymentAuthorizationUrl)))
        .returning({ id: orders.id }));
      if (savedAuthorization.length !== 1) throw new Error("This checkout reservation has expired. Please return to your bag and try again.");
      return { success: true, authorizationUrl: payment.authorization_url };
    } catch (error) {
      await transactionDb.transaction(async (tx) => releaseInventoryReservation(tx, result.id, "payment_initialization_failed"));
      throw error;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existingOrder = await transactionDb.query.orders.findFirst({ where: eq(orders.checkoutIdempotencyKey, parsed.data.idempotencyKey) });
      if (existingOrder && existingOrder.customerEmail.toLowerCase() === parsed.data.customerEmail.toLowerCase() && existingOrder.paymentStatus === "pending" && existingOrder.reservationStatus === "active") {
        if (existingOrder.paymentAuthorizationUrl) return { success: true, authorizationUrl: existingOrder.paymentAuthorizationUrl };
        return { success: false, message: "Your payment is still being prepared. Please try again in a moment." };
      }
    }
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not place your order.",
    };
  }
}

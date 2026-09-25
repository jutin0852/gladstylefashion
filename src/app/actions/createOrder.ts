"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "../../lib/auth";
import { transactionDb } from "../../lib/transaction-db";
import { categories, orderItems, orders, products, productImages } from "../../lib/schema";
import { initializePaystackPayment } from "@/lib/paystack";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(255),
  customerPhone: z.string().trim().min(5).max(30),
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  country: z.literal("Nigeria"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
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

export async function createOrder(formData: FormData): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone") || undefined,
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

  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) || 0) + item.quantity,
    );
  }
  const productIds = [...quantities.keys()];

  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    const result = await transactionDb.transaction(async (tx) => {
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
        if (item.size && product.sizes && !product.sizes.includes(item.size)) {
          throw new Error(
            `${product.productName} does not offer size ${item.size}.`,
          );
        }
        const quantity = item.quantity;
        const unitPrice = Number(product.price);
        return {
          product,
          quantity,
          size: item.size,
          unitPrice,
          totalPrice: unitPrice * quantity,
          customizations: item.customizations,
        };
      });
      for (const [productId, quantity] of quantities) {
        const product = productsById.get(productId);
        if (!product || quantity > (product.inventoryCount || 0)) {
          throw new Error(
            `${product?.productName || "A product"} does not have enough stock.`,
          );
        }
      }
      const totalAmount = lineItems.reduce(
        (total, item) => total + item.totalPrice,
        0,
      );
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
          totalAmount: totalAmount.toFixed(2),
          shippingAddress: {
            street: parsed.data.street,
            city: parsed.data.city,
            state: parsed.data.state,
            postalCode: "",
            country: parsed.data.country,
          },
          paymentIntentId: paymentReference,
          paymentStatus: "pending",
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber, paymentIntentId: orders.paymentIntentId, totalAmount: orders.totalAmount });

      await tx.insert(orderItems).values(
        lineItems.map(({ product, quantity, size, unitPrice, totalPrice, customizations }) => ({
          orderId: order.id,
          productId: product.id,
          productName: product.productName,
          productImage: firstImageByProduct.get(product.id) || null,
          size: size || null,
          customizations: customizations || null,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
        })),
      );

      return order;
    });
    try {
      const payment = await initializePaystackPayment({
        email: parsed.data.customerEmail,
        amount: Math.round(Number(result.totalAmount) * 100),
        reference: result.paymentIntentId!,
        // Paystack appends the transaction reference to this URL after payment.
        // Supplying our own query parameter here can create a malformed duplicate
        // reference for transfer redirects.
        callbackUrl: `${createSiteUrl(requestHeaders)}/checkout/verify`,
        orderId: result.id,
        orderNumber: result.orderNumber,
      });
      return { success: true, authorizationUrl: payment.authorization_url };
    } catch (error) {
      await transactionDb.update(orders).set({ paymentStatus: "failed", updatedAt: new Date() }).where(eq(orders.id, result.id));
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not place your order.",
    };
  }
}

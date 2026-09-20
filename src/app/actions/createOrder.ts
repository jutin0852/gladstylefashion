"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { auth } from "../../lib/auth";
import { transactionDb } from "../../lib/transaction-db";
import { orderItems, orders, products, productImages } from "../../lib/schema";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(255),
  customerPhone: z.string().trim().max(30).optional(),
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(2).max(20),
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
  | { success: true; orderNumber: string }
  | { success: false; message: string };

export async function createOrder(formData: FormData): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone") || undefined,
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
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
    const session = await auth.api.getSession({ headers: await headers() });
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
            postalCode: parsed.data.postalCode,
            country: parsed.data.country,
          },
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

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

      for (const item of lineItems) {
        const updated = await tx
          .update(products)
          .set({
            inventoryCount: sql`${products.inventoryCount} - ${item.quantity}`,
          })
          .where(
            and(
              eq(products.id, item.product.id),
              gte(products.inventoryCount, item.quantity),
            ),
          )
          .returning({ id: products.id });
        if (updated.length !== 1) {
          throw new Error(
            `${item.product.productName} sold out while you were checking out.`,
          );
        }
      }

      return order;
    });

    return { success: true, orderNumber: result.orderNumber };
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

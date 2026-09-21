import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { transactionDb } from "./transaction-db";
import { orderItems, orders, products } from "./schema";
import { verifyPaystackPayment } from "./paystack";

export type PaymentVerificationResult =
  | { state: "paid"; orderNumber: string }
  | { state: "pending"; message: string }
  | { state: "failed"; message: string }
  | { state: "review"; orderNumber: string };

export async function verifyAndFinalizePaystackPayment(reference: string): Promise<PaymentVerificationResult> {
  const order = await db.query.orders.findFirst({ where: eq(orders.paymentIntentId, reference) });
  if (!order) return { state: "failed", message: "We could not find this payment." };
  if (order.paymentStatus === "paid") return { state: "paid", orderNumber: order.orderNumber };

  let payment;
  try {
    payment = await verifyPaystackPayment(reference);
  } catch (error) {
    return { state: "pending", message: error instanceof Error ? error.message : "We are still checking your payment." };
  }

  if (payment.status !== "success") {
    if (["failed", "abandoned", "reversed"].includes(payment.status)) {
      await db.update(orders).set({ paymentStatus: "failed", updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "pending")));
      return { state: "failed", message: "Your payment was not completed. Your bag is still available for checkout." };
    }
    return { state: "pending", message: "Your payment is still being confirmed. Please wait a moment and refresh this page." };
  }

  const expectedAmount = Math.round(Number(order.totalAmount) * 100);
  if (payment.reference !== reference || payment.currency !== "NGN" || payment.amount !== expectedAmount) {
    return { state: "review", orderNumber: order.orderNumber };
  }

  try {
    return await transactionDb.transaction(async (tx) => {
      await tx.execute(sql`select "id" from "orders" where "payment_intent_id" = ${reference} for update`);
      const lockedOrder = await tx.query.orders.findFirst({
        where: eq(orders.paymentIntentId, reference),
        with: { items: true },
      });
      if (!lockedOrder) throw new Error("Order not found.");
      if (lockedOrder.paymentStatus === "paid") return { state: "paid", orderNumber: lockedOrder.orderNumber } as const;

      const quantities = new Map<string, number>();
      for (const item of lockedOrder.items) {
        if (!item.productId) throw new Error("An item in this order is unavailable.");
        quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
      }
      const productIds = [...quantities.keys()];
      const catalogProducts = await tx.select().from(products).where(and(inArray(products.id, productIds), eq(products.isActive, true)));
      if (catalogProducts.length !== productIds.length) throw new Error("One or more products are no longer available.");
      const productById = new Map(catalogProducts.map((product) => [product.id, product]));

      for (const [productId, quantity] of quantities) {
        const product = productById.get(productId);
        const updated = await tx.update(products).set({ inventoryCount: sql`coalesce(${products.inventoryCount}, 0) - ${quantity}`, updatedAt: new Date() }).where(and(eq(products.id, productId), gte(products.inventoryCount, quantity))).returning({ id: products.id });
        if (updated.length !== 1) throw new Error(`${product?.productName || "A product"} is no longer in stock.`);
      }
      await tx.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, lockedOrder.id));
      return { state: "paid", orderNumber: lockedOrder.orderNumber } as const;
    });
  } catch {
    await db.update(orders).set({ paymentStatus: "paid_stock_review", updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "pending")));
    return { state: "review", orderNumber: order.orderNumber };
  }
}

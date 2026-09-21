"use server";

import { requireAdmin } from "../../lib/admin-auth";
import { transactionDb } from "../../lib/transaction-db";
import { orderFulfillmentEvents, orders, products } from "../../lib/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const statuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const allowedTransitions: Record<(typeof statuses)[number], (typeof statuses)[number][]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function changeOrderStatus(orderId: string, status: string, shipment?: { carrier?: string; trackingNumber?: string }) {
  await requireAdmin();
  if (!statuses.includes(status as (typeof statuses)[number])) {
    return { success: false, message: "Invalid order status." };
  }
  const nextStatus = status as (typeof statuses)[number];
  try {
    await transactionDb.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
      if (!order) throw new Error("Order not found.");
      if (nextStatus !== "cancelled" && order.paymentStatus !== "paid") {
        throw new Error("This order cannot be fulfilled until its payment is confirmed.");
      }
      const currentStatus = order.status as (typeof statuses)[number];
      if (currentStatus === nextStatus) return;
      if (!allowedTransitions[currentStatus]?.includes(nextStatus)) throw new Error(`Cannot change an ${currentStatus} order to ${nextStatus}.`);
      if (nextStatus === "shipped" && (!shipment?.carrier?.trim() || !shipment?.trackingNumber?.trim())) throw new Error("Carrier and tracking number are required before shipping.");
      if (nextStatus === "cancelled" && order.paymentStatus === "paid") {
        for (const item of order.items) {
          if (item.productId) await tx.update(products).set({ inventoryCount: sql`coalesce(${products.inventoryCount}, 0) + ${item.quantity}`, updatedAt: new Date() }).where(eq(products.id, item.productId));
        }
      }
      const now = new Date();
      await tx.update(orders).set({
        status: nextStatus,
        carrier: shipment?.carrier?.trim() || order.carrier,
        trackingNumber: shipment?.trackingNumber?.trim() || order.trackingNumber,
        shippedAt: nextStatus === "shipped" ? now : order.shippedAt,
        deliveredAt: nextStatus === "delivered" ? now : order.deliveredAt,
        updatedAt: now,
      }).where(eq(orders.id, orderId));
      await tx.insert(orderFulfillmentEvents).values({ orderId, status: nextStatus, message: nextStatus === "cancelled" ? order.paymentStatus === "paid" ? "Order cancelled and stock returned to inventory." : "Unpaid order cancelled." : nextStatus === "shipped" ? `Shipped with ${shipment?.carrier}: ${shipment?.trackingNumber}` : `Order marked ${nextStatus}.` });
    });
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to update the order." };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

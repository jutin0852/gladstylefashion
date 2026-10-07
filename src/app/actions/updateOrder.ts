"use server";

import { requireAdmin } from "../../lib/admin-auth";
import { transactionDb } from "../../lib/transaction-db";
import { orderFulfillmentEvents, orders, products, productVariants } from "../../lib/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getReservationMinutes, releaseInventoryReservation } from "@/lib/inventory-reservations";
import { drainEmailOutboxBestEffort, queueEmailOutbox } from "@/lib/email-outbox";

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

export async function changeOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  if (!statuses.includes(status as (typeof statuses)[number])) {
    return { success: false, message: "Invalid order status." };
  }
  const nextStatus = status as (typeof statuses)[number];
  let emailNotification: { status: "processing" | "shipped" | "delivered" | "cancelled" } | null = null;
  try {
    emailNotification = await transactionDb.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
      if (!order) throw new Error("Order not found.");
      if (nextStatus !== "cancelled" && order.paymentStatus !== "paid") {
        throw new Error("This order cannot be fulfilled until its payment is confirmed.");
      }
      const currentStatus = order.status as (typeof statuses)[number];
      if (currentStatus === nextStatus) return null;
      if (!allowedTransitions[currentStatus]?.includes(nextStatus)) throw new Error(`Cannot change an ${currentStatus} order to ${nextStatus}.`);
      if (nextStatus === "cancelled" && order.paymentStatus === "paid") {
        for (const item of order.items) {
          if (item.variantId) await tx.update(productVariants).set({ inventoryCount: sql`${productVariants.inventoryCount} + ${item.quantity}`, updatedAt: new Date() }).where(eq(productVariants.id, item.variantId));
          else if (item.productId) await tx.update(products).set({ inventoryCount: sql`coalesce(${products.inventoryCount}, 0) + ${item.quantity}`, updatedAt: new Date() }).where(eq(products.id, item.productId));
        }
      }
      const now = new Date();
      await tx.update(orders).set({
        status: nextStatus,
        shippedAt: nextStatus === "shipped" ? now : order.shippedAt,
        deliveredAt: nextStatus === "delivered" ? now : order.deliveredAt,
        updatedAt: now,
      }).where(eq(orders.id, orderId));
      await tx.insert(orderFulfillmentEvents).values({
        orderId,
        status: nextStatus,
        message:
          nextStatus === "cancelled"
            ? order.paymentStatus === "paid"
              ? "Order cancelled and stock returned to inventory."
              : "Unpaid order cancelled."
            : nextStatus === "shipped"
              ? "Order marked as shipped."
              : `Order marked ${nextStatus}.`,
      });

      if (["processing", "shipped", "delivered", "cancelled"].includes(nextStatus)) {
        const status = nextStatus as "processing" | "shipped" | "delivered" | "cancelled";
        await queueEmailOutbox(tx, {
          dedupeKey: `order-${status}:${order.id}`,
          eventType: `order-${status}` as "order-processing" | "order-shipped" | "order-delivered" | "order-cancelled",
          recipient: order.customerEmail,
          orderId: order.id,
          payload: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            status,
          },
        });
        return { status };
      }

      return null;
    });
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to update the order." };
  }
  if (emailNotification) await drainEmailOutboxBestEffort();
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  return { success: true, message: emailNotification ? `Order updated and ${emailNotification.status} email queued.` : "Order updated." };
}

export async function clearAbandonedCheckout(orderId: string) {
  await requireAdmin();
  try {
    await transactionDb.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
      if (!order) throw new Error("Checkout record not found.");
      if (order.status !== "pending" || order.paymentStatus === "paid") {
        throw new Error("Only unpaid, unfulfilled checkout records can be removed.");
      }
      const ageInMinutes = order.createdAt ? (Date.now() - order.createdAt.getTime()) / 60_000 : getReservationMinutes() + 1;
      if (order.reservationStatus === "active" && order.reservationExpiresAt && order.reservationExpiresAt > new Date()) {
        throw new Error("Wait until this reservation expires before clearing the checkout.");
      }
      if (order.reservationStatus === "active" && ageInMinutes < getReservationMinutes()) {
        throw new Error("Wait until this reservation expires before clearing the checkout.");
      }
      if (order.reservationStatus === "active") await releaseInventoryReservation(tx, orderId, "expired");
      await tx.delete(orders).where(eq(orders.id, orderId));
    });
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to remove this checkout record." };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  return { success: true };
}

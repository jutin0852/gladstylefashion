"use server";

import { requireAdmin } from "../../lib/admin-auth";
import { transactionDb } from "../../lib/transaction-db";
import { orderFulfillmentEvents, orders, products } from "../../lib/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

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
  let processingNotification: { customerEmail: string; customerName: string; orderNumber: string } | null = null;
  try {
    processingNotification = await transactionDb.transaction(async (tx) => {
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
          if (item.productId) await tx.update(products).set({ inventoryCount: sql`coalesce(${products.inventoryCount}, 0) + ${item.quantity}`, updatedAt: new Date() }).where(eq(products.id, item.productId));
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

      if (nextStatus === "processing") {
        return {
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          orderNumber: order.orderNumber,
        };
      }

      return null;
    });
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to update the order." };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  if (processingNotification) {
    try {
      await sendEmail({
        to: processingNotification.customerEmail,
        subject: `Your Glad Style Fashion order ${processingNotification.orderNumber} is being prepared`,
        text: `Hello ${processingNotification.customerName}, your order ${processingNotification.orderNumber} is now being processed. We are preparing it and will update you when it has been sent.`,
        html: `<p>Hello ${escapeHtml(processingNotification.customerName)},</p><p>Your order <strong>${escapeHtml(processingNotification.orderNumber)}</strong> is now being processed. We are preparing it and will update you when it has been sent.</p>`,
      });
    } catch {
      return { success: true, message: "Order updated, but the processing email could not be sent." };
    }
  }

  return { success: true, message: processingNotification ? "Order updated and processing email sent." : "Order updated." };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
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
      const ageInMinutes = order.createdAt ? (Date.now() - order.createdAt.getTime()) / 60_000 : 31;
      if (order.paymentStatus === "pending" && ageInMinutes < 30) {
        throw new Error("Wait 30 minutes before clearing a pending payment so an active checkout is not removed.");
      }
      await tx.delete(orders).where(eq(orders.id, orderId));
    });
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to remove this checkout record." };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  return { success: true };
}

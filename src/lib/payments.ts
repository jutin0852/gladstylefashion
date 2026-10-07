import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "./db";
import { transactionDb } from "./transaction-db";
import { orders } from "./schema";
import { matchesPaystackPayment, verifyPaystackPayment } from "./paystack";
import { isReservationActive, releaseInventoryReservation } from "./inventory-reservations";
import { parseNairaToKobo } from "./money";
import { queueEmailOutbox } from "./email-outbox";

export type PaymentVerificationResult =
  | { state: "paid"; orderNumber: string }
  | { state: "pending"; message: string }
  | { state: "failed"; message: string }
  | { state: "review"; orderNumber: string };

async function queueRefundRequiredEmail(tx: Parameters<Parameters<typeof transactionDb.transaction>[0]>[0], order: { id: string; orderNumber: string; totalAmount: string | null }, reason: string) {
  await queueEmailOutbox(tx, {
    dedupeKey: `refund-required:${order.id}`,
    eventType: "refund-required",
    orderId: order.id,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: String(order.totalAmount || "0.00"),
      reason,
    },
  });
}

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
    if (!isReservationActive(order.reservationStatus, order.reservationExpiresAt)) {
      await transactionDb.transaction(async (tx) => releaseInventoryReservation(tx, order.id, "expired"));
      return { state: "failed", message: "This checkout reservation has expired. Please return to your bag and start again." };
    }
    return { state: "pending", message: ["failed", "abandoned", "reversed"].includes(payment.status) ? "Your payment was not completed. Your reserved stock is still held for a short time so you can try again." : "Your payment is still being confirmed. Please wait a moment and refresh this page." };
  }

  let expectedAmountKobo: bigint | null = null;
  try {
    expectedAmountKobo = parseNairaToKobo(order.totalAmount);
  } catch {
    expectedAmountKobo = null;
  }
  if (expectedAmountKobo === null || !matchesPaystackPayment(payment, reference, expectedAmountKobo)) {
    await transactionDb.transaction(async (tx) => {
      await tx.execute(sql`select "id" from "orders" where "payment_intent_id" = ${reference} for update`);
      await releaseInventoryReservation(tx, order.id, "expired");
      await tx.update(orders).set({ paymentStatus: "refund_required", updatedAt: new Date() }).where(and(eq(orders.id, order.id), ne(orders.paymentStatus, "paid")));
      await queueRefundRequiredEmail(tx, order, "Paystack payment details did not match the order.");
    });
    return { state: "review", orderNumber: order.orderNumber };
  }

  try {
    const result = await transactionDb.transaction(async (tx) => {
      await tx.execute(sql`select "id" from "orders" where "payment_intent_id" = ${reference} for update`);
      const lockedOrder = await tx.query.orders.findFirst({
        where: eq(orders.paymentIntentId, reference),
        with: { items: true },
      });
      if (!lockedOrder) throw new Error("Order not found.");
      if (lockedOrder.paymentStatus === "paid") return { state: "paid", orderNumber: lockedOrder.orderNumber } as const;
      if (lockedOrder.paymentStatus === "refund_required") return { state: "review", orderNumber: lockedOrder.orderNumber } as const;
      if (!isReservationActive(lockedOrder.reservationStatus, lockedOrder.reservationExpiresAt)) {
        if (lockedOrder.reservationStatus === "active") await releaseInventoryReservation(tx, lockedOrder.id, "expired");
        await tx.update(orders).set({ paymentStatus: "refund_required", updatedAt: new Date() }).where(and(eq(orders.id, lockedOrder.id), ne(orders.paymentStatus, "paid")));
        await queueRefundRequiredEmail(tx, lockedOrder, "Payment arrived after the inventory reservation expired.");
        return { state: "review", orderNumber: lockedOrder.orderNumber } as const;
      }
      await tx.update(orders).set({ paymentStatus: "paid", reservationStatus: "converted", updatedAt: new Date() }).where(and(eq(orders.id, lockedOrder.id), eq(orders.paymentStatus, "pending"), eq(orders.reservationStatus, "active")));
      await queueEmailOutbox(tx, {
        dedupeKey: `payment-confirmed:${lockedOrder.id}`,
        eventType: "payment-confirmed",
        recipient: lockedOrder.customerEmail,
        orderId: lockedOrder.id,
        payload: {
          orderId: lockedOrder.id,
          orderNumber: lockedOrder.orderNumber,
          customerName: lockedOrder.customerName,
          totalAmount: String(lockedOrder.totalAmount),
          items: lockedOrder.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            size: item.size,
            totalPrice: String(item.totalPrice),
          })),
        },
      });
      return {
        state: "paid",
        orderNumber: lockedOrder.orderNumber,
      } as const;
    });
    return { state: result.state, orderNumber: result.orderNumber } as PaymentVerificationResult;
  } catch {
    await transactionDb.transaction(async (tx) => {
      await releaseInventoryReservation(tx, order.id, "expired");
      await tx.update(orders).set({ paymentStatus: "refund_required", updatedAt: new Date() }).where(and(eq(orders.id, order.id), ne(orders.paymentStatus, "paid")));
      await queueRefundRequiredEmail(tx, order, "Payment finalization failed and requires manual review.");
    });
    return { state: "review", orderNumber: order.orderNumber };
  }
}

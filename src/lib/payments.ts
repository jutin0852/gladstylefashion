import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "./db";
import { transactionDb } from "./transaction-db";
import { orders } from "./schema";
import { matchesPaystackPayment, verifyPaystackPayment } from "./paystack";
import { brandedEmail, escapeEmailHtml, sendEmail } from "./email";
import { isReservationActive, releaseInventoryReservation } from "./inventory-reservations";
import { formatNairaDecimal, parseNairaToKobo } from "./money";

export type PaymentVerificationResult =
  | { state: "paid"; orderNumber: string }
  | { state: "pending"; message: string }
  | { state: "failed"; message: string }
  | { state: "review"; orderNumber: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
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
        return { state: "review", orderNumber: lockedOrder.orderNumber } as const;
      }
      await tx.update(orders).set({ paymentStatus: "paid", reservationStatus: "converted", updatedAt: new Date() }).where(and(eq(orders.id, lockedOrder.id), eq(orders.paymentStatus, "pending"), eq(orders.reservationStatus, "active")));
      return {
        state: "paid",
        orderNumber: lockedOrder.orderNumber,
        confirmation: {
          customerEmail: lockedOrder.customerEmail,
          customerName: lockedOrder.customerName,
          totalAmount: lockedOrder.totalAmount,
          items: lockedOrder.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            size: item.size,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      } as const;
    });
    if ("confirmation" in result && result.confirmation) {
      const confirmation = result.confirmation;
      const itemsText = confirmation.items
        .map((item) => `- ${item.name} × ${item.quantity}${item.size ? ` (size ${item.size})` : ""} — ${formatNairaDecimal(item.totalPrice)}`)
        .join("\n");
      const itemsHtml = result.confirmation.items
        .map((item) => `<tr><td style="padding:12px 0;border-bottom:1px solid #eadfe3"><strong>${escapeHtml(item.name)}</strong>${item.size ? `<br><span style="color:#666;font-size:12px">Size ${escapeHtml(item.size)}</span>` : ""}</td><td style="padding:12px 0;border-bottom:1px solid #eadfe3;text-align:center">${item.quantity}</td><td style="padding:12px 0;border-bottom:1px solid #eadfe3;text-align:right">${formatNairaDecimal(item.totalPrice)}</td></tr>`)
        .join("");
      try {
        await sendEmail({
          to: confirmation.customerEmail,
          subject: `Order ${result.orderNumber} confirmed — Glad Style Fashion`,
          text: `Hello ${confirmation.customerName},\n\nThank you for your order ${result.orderNumber}. Your payment was confirmed.\n\nItems:\n${itemsText}\n\nTotal: ${formatNairaDecimal(confirmation.totalAmount)}\n\nWe will email you again when your order is being prepared.`,
          html: brandedEmail({ title: "Your order is confirmed.", eyebrow: `Order ${escapeHtml(result.orderNumber)}`, intro: `Thank you, ${escapeEmailHtml(confirmation.customerName)}. Your payment was confirmed and we are getting your order ready.`, body: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:collapse;font-size:14px"><thead><tr><th align="left" style="padding:10px 0;border-bottom:1px solid #171717;font-size:11px;text-transform:uppercase;letter-spacing:1px">Item</th><th align="center" style="padding:10px 0;border-bottom:1px solid #171717;font-size:11px;text-transform:uppercase;letter-spacing:1px">Qty</th><th align="right" style="padding:10px 0;border-bottom:1px solid #171717;font-size:11px;text-transform:uppercase;letter-spacing:1px">Price</th></tr></thead><tbody>${itemsHtml}</tbody><tfoot><tr><td colspan="2" style="padding:16px 0 0;font-weight:bold">Total paid</td><td align="right" style="padding:16px 0 0;font-weight:bold">${formatNairaDecimal(confirmation.totalAmount)}</td></tr></tfoot></table>`, ctaLabel: "Visit the store", ctaUrl: process.env.NEXT_PUBLIC_APP_URL || "https://gladstylefashion.com", expiry: "We will email you again when your order is being prepared." }),
        });
      } catch (error) {
        console.error("Order confirmation email failed", error);
      }
    }
    return { state: result.state, orderNumber: result.orderNumber } as PaymentVerificationResult;
  } catch {
    await transactionDb.transaction(async (tx) => {
      await releaseInventoryReservation(tx, order.id, "expired");
      await tx.update(orders).set({ paymentStatus: "refund_required", updatedAt: new Date() }).where(and(eq(orders.id, order.id), ne(orders.paymentStatus, "paid")));
    });
    return { state: "review", orderNumber: order.orderNumber };
  }
}

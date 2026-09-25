import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { transactionDb } from "./transaction-db";
import { orders, products } from "./schema";
import { verifyPaystackPayment } from "./paystack";
import { brandedEmail, escapeEmailHtml, sendEmail } from "./email";

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
    const result = await transactionDb.transaction(async (tx) => {
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
        .map((item) => `- ${item.name} × ${item.quantity}${item.size ? ` (size ${item.size})` : ""} — ₦${Number(item.totalPrice).toLocaleString("en-NG")}`)
        .join("\n");
      const itemsHtml = result.confirmation.items
        .map((item) => `<tr><td style="padding:12px 0;border-bottom:1px solid #eadfe3"><strong>${escapeHtml(item.name)}</strong>${item.size ? `<br><span style="color:#666;font-size:12px">Size ${escapeHtml(item.size)}</span>` : ""}</td><td style="padding:12px 0;border-bottom:1px solid #eadfe3;text-align:center">${item.quantity}</td><td style="padding:12px 0;border-bottom:1px solid #eadfe3;text-align:right">₦${Number(item.totalPrice).toLocaleString("en-NG")}</td></tr>`)
        .join("");
      try {
        await sendEmail({
          to: confirmation.customerEmail,
          subject: `Order ${result.orderNumber} confirmed — Glad Style Fashion`,
          text: `Hello ${confirmation.customerName},\n\nThank you for your order ${result.orderNumber}. Your payment was confirmed.\n\nItems:\n${itemsText}\n\nTotal: ₦${Number(confirmation.totalAmount).toLocaleString("en-NG")}\n\nWe will email you again when your order is being prepared.`,
          html: brandedEmail({ title: "Your order is confirmed.", eyebrow: `Order ${escapeHtml(result.orderNumber)}`, intro: `Thank you, ${escapeEmailHtml(confirmation.customerName)}. Your payment was confirmed and we are getting your order ready.`, body: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:collapse;font-size:14px"><thead><tr><th align="left" style="padding:10px 0;border-bottom:1px solid #171717;font-size:11px;text-transform:uppercase;letter-spacing:1px">Item</th><th align="center" style="padding:10px 0;border-bottom:1px solid #171717;font-size:11px;text-transform:uppercase;letter-spacing:1px">Qty</th><th align="right" style="padding:10px 0;border-bottom:1px solid #171717;font-size:11px;text-transform:uppercase;letter-spacing:1px">Price</th></tr></thead><tbody>${itemsHtml}</tbody><tfoot><tr><td colspan="2" style="padding:16px 0 0;font-weight:bold">Total paid</td><td align="right" style="padding:16px 0 0;font-weight:bold">₦${Number(confirmation.totalAmount).toLocaleString("en-NG")}</td></tr></tfoot></table>`, ctaLabel: "Visit the store", ctaUrl: process.env.NEXT_PUBLIC_APP_URL || "https://gladstylefashion.com", expiry: "We will email you again when your order is being prepared." }),
        });
      } catch (error) {
        console.error("Order confirmation email failed", error);
      }
    }
    return { state: result.state, orderNumber: result.orderNumber } as PaymentVerificationResult;
  } catch {
    await db.update(orders).set({ paymentStatus: "paid_stock_review", updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "pending")));
    return { state: "review", orderNumber: order.orderNumber };
  }
}

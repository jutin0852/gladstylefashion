import { brandedEmail, escapeEmailHtml, type EmailMessage } from "./email";
import { formatNairaDecimal } from "./money";

export type EmailEventType =
  | "payment-confirmed"
  | "refund-required"
  | "refund-initiated"
  | "refund-completed"
  | "order-processing"
  | "order-shipped"
  | "order-delivered"
  | "order-cancelled"
  | "staff-invitation";

export type OrderEmailItem = {
  name: string;
  quantity: number;
  size: string | null;
  totalPrice: string;
};

export type EmailOutboxPayload = {
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  totalAmount?: string;
  items?: OrderEmailItem[];
  status?: string;
  reason?: string;
  refundAmount?: string;
  acceptUrl?: string;
  invitationId?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

function required(payload: EmailOutboxPayload, key: keyof EmailOutboxPayload) {
  const value = payload[key];
  if (typeof value !== "string" || !value) throw new Error(`Email payload is missing ${key}.`);
  return value;
}

function orderStatusEmail(payload: EmailOutboxPayload, recipient: string, status: "processing" | "shipped" | "delivered" | "cancelled"): EmailMessage {
  const orderNumber = required(payload, "orderNumber");
  const customerName = required(payload, "customerName");
  const subject = status === "processing"
    ? `Your Glad Style Fashion order ${orderNumber} is being prepared`
    : status === "shipped"
      ? `Your Glad Style Fashion order ${orderNumber} is on its way`
      : status === "delivered"
        ? `Your Glad Style Fashion order ${orderNumber} has been delivered`
        : `Your Glad Style Fashion order ${orderNumber} was cancelled`;
  const intro = status === "processing"
    ? `Hello ${escapeEmailHtml(customerName)}. Your order is now being processed.`
    : status === "shipped"
      ? `Hello ${escapeEmailHtml(customerName)}. Your order has been sent.`
      : status === "delivered"
        ? `Hello ${escapeEmailHtml(customerName)}. Your order has been marked as delivered.`
        : `Hello ${escapeEmailHtml(customerName)}. Your order has been cancelled.`;
  const text = status === "processing"
    ? `Hello ${customerName}, your order ${orderNumber} is now being processed. We are preparing it and will update you when it has been sent.`
    : status === "shipped"
      ? `Hello ${customerName}, your order ${orderNumber} is on its way. We will share any further delivery updates when available.`
      : status === "delivered"
        ? `Hello ${customerName}, your order ${orderNumber} has been marked as delivered. Thank you for shopping with Glad Style Fashion.`
        : `Hello ${customerName}, your order ${orderNumber} was cancelled. Please contact us if you need help.`;
  const title = status === "processing"
    ? "We are preparing your order."
    : status === "shipped"
      ? "Your order is on its way."
      : status === "delivered"
        ? "Your order has arrived."
        : "Your order was cancelled.";
  const body = status === "processing"
    ? "We are preparing your pieces carefully and will update you when your order has been sent."
    : status === "shipped"
      ? "Your order has left us and is on its way to you."
      : status === "delivered"
        ? "We hope you enjoy your pieces."
        : "If you believe this cancellation is unexpected, please contact us for assistance.";
  return {
    to: recipient,
    subject,
    text,
    html: brandedEmail({
      title,
      eyebrow: `Order ${escapeHtml(orderNumber)}`,
      intro,
      body,
      ctaLabel: "Visit the store",
      ctaUrl: process.env.NEXT_PUBLIC_APP_URL || "https://gladstylefashion.com",
    }),
  };
}

export function renderTransactionalEmail(eventType: EmailEventType, payload: EmailOutboxPayload, recipient: string): EmailMessage {
  if (!recipient) throw new Error("Email recipient is not configured.");
  if (!["payment-confirmed", "refund-required", "refund-initiated", "refund-completed", "order-processing", "order-shipped", "order-delivered", "order-cancelled", "staff-invitation"].includes(eventType)) {
    throw new Error("Email event type is not supported.");
  }

  if (eventType === "payment-confirmed") {
    const orderNumber = required(payload, "orderNumber");
    const customerName = required(payload, "customerName");
    const totalAmount = required(payload, "totalAmount");
    const items = payload.items || [];
    const itemsText = items.map((item) => `- ${item.name} × ${item.quantity}${item.size ? ` (size ${item.size})` : ""} — ${formatNairaDecimal(item.totalPrice)}`).join("\n");
    const itemsHtml = items.map((item) => `<tr><td style="padding:12px 0;border-bottom:1px solid #eadfe3"><strong>${escapeHtml(item.name)}</strong>${item.size ? `<br><span style="color:#666;font-size:12px">Size ${escapeHtml(item.size)}</span>` : ""}</td><td style="padding:12px 0;border-bottom:1px solid #eadfe3;text-align:center">${item.quantity}</td><td style="padding:12px 0;border-bottom:1px solid #eadfe3;text-align:right">${formatNairaDecimal(item.totalPrice)}</td></tr>`).join("");
    return {
      to: recipient,
      subject: `Order ${orderNumber} confirmed — Glad Style Fashion`,
      text: `Hello ${customerName},\n\nThank you for your order ${orderNumber}. Your payment was confirmed.\n\nItems:\n${itemsText}\n\nTotal: ${formatNairaDecimal(totalAmount)}\n\nWe will email you again when your order is being prepared.`,
      html: brandedEmail({
        title: "Your order is confirmed.",
        eyebrow: `Order ${escapeHtml(orderNumber)}`,
        intro: `Thank you, ${escapeEmailHtml(customerName)}. Your payment was confirmed and we are getting your order ready.`,
        body: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:collapse;font-size:14px"><thead><tr><th align="left" style="padding:10px 0;border-bottom:1px solid #171717;font-size:11px;text-transform:uppercase;letter-spacing:1px">Item</th><th align="center" style="padding:10px 0;border-bottom:1px solid #171717;font-size:11px;text-transform:uppercase;letter-spacing:1px">Qty</th><th align="right" style="padding:10px 0;border-bottom:1px solid #171717;font-size:11px;text-transform:uppercase;letter-spacing:1px">Price</th></tr></thead><tbody>${itemsHtml}</tbody><tfoot><tr><td colspan="2" style="padding:16px 0 0;font-weight:bold">Total paid</td><td align="right" style="padding:16px 0 0;font-weight:bold">${formatNairaDecimal(totalAmount)}</td></tr></tfoot></table>`,
        ctaLabel: "Visit the store",
        ctaUrl: process.env.NEXT_PUBLIC_APP_URL || "https://gladstylefashion.com",
        expiry: "We will email you again when your order is being prepared.",
      }),
    };
  }

  if (eventType === "refund-required") {
    const orderNumber = required(payload, "orderNumber");
    const totalAmount = required(payload, "totalAmount");
    const reason = payload.reason || "Payment requires review.";
    return {
      to: recipient,
      subject: `Payment review required for ${orderNumber}`,
      text: `Payment review is required for order ${orderNumber}. Amount: ${formatNairaDecimal(totalAmount)}. Reason: ${reason}`,
      html: brandedEmail({
        title: "Payment review required.",
        eyebrow: `Order ${escapeHtml(orderNumber)}`,
        intro: `Order ${escapeEmailHtml(orderNumber)} requires payment review before fulfilment can continue.`,
        body: `Amount: ${formatNairaDecimal(totalAmount)}<br>Reason: ${escapeHtml(reason)}`,
        ctaLabel: "Open store admin",
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://gladstylefashion.com"}/admin/orders`,
      }),
    };
  }

  if (eventType === "refund-initiated" || eventType === "refund-completed") {
    const orderNumber = required(payload, "orderNumber");
    const customerName = required(payload, "customerName");
    const refundAmount = required(payload, "refundAmount");
    const initiated = eventType === "refund-initiated";
    return {
      to: recipient,
      subject: initiated ? `Your refund for order ${orderNumber} has started` : `Your refund for order ${orderNumber} is complete`,
      text: `Hello ${customerName}, your ${initiated ? "refund has been initiated" : "refund is complete"} for order ${orderNumber}. Refund amount: ${formatNairaDecimal(refundAmount)}.`,
      html: brandedEmail({
        title: initiated ? "Your refund has started." : "Your refund is complete.",
        eyebrow: `Order ${escapeHtml(orderNumber)}`,
        intro: `Hello ${escapeEmailHtml(customerName)}. Your refund ${initiated ? "has been initiated" : "has been completed"}.`,
        body: `Refund amount: ${formatNairaDecimal(refundAmount)}.`,
        ctaLabel: "Visit the store",
        ctaUrl: process.env.NEXT_PUBLIC_APP_URL || "https://gladstylefashion.com",
      }),
    };
  }

  if (eventType === "staff-invitation") {
    const acceptUrl = required(payload, "acceptUrl");
    return {
      to: recipient,
      subject: "You have been invited to Glad Style Fashion admin",
      text: `Accept your staff invitation: ${acceptUrl}`,
      html: `<p>You have been invited to help run Glad Style Fashion.</p><p><a href="${escapeEmailHtml(acceptUrl)}">Accept staff invitation</a></p><p>This link expires in seven days.</p>`,
    };
  }

  const status = eventType.replace("order-", "") as "processing" | "shipped" | "delivered" | "cancelled";
  return orderStatusEmail(payload, recipient, status);
}

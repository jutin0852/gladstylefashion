import { createHmac, timingSafeEqual } from "crypto";

const PAYSTACK_API_URL = "https://api.paystack.co";

type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
};

function getSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Online payments are not configured yet. Please try again later.");
  }
  return secretKey;
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json()) as { status: boolean; message?: string; data?: T };
  if (!response.ok || !body.status || !body.data) {
    throw new Error(body.message || "We could not start your payment. Please try again.");
  }
  return body.data;
}

export async function initializePaystackPayment(input: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  orderId: string;
  orderNumber: string;
}) {
  return paystackRequest<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
      },
    }),
  });
}

export async function verifyPaystackPayment(reference: string) {
  return paystackRequest<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

export function hasValidPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

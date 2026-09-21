import { NextResponse } from "next/server";
import { hasValidPaystackSignature } from "@/lib/paystack";
import { verifyAndFinalizePaystackPayment } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!hasValidPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }
  try {
    const payload = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };
    if (payload.event === "charge.success" && payload.data?.reference) {
      await verifyAndFinalizePaystackPayment(payload.data.reference);
    }
  } catch {
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
  return NextResponse.json({ received: true });
}

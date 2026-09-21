import PaymentConfirmation from "@/components/store/payment-confirmation";
import { verifyAndFinalizePaystackPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function VerifyPaymentPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams;
  const result = reference
    ? await verifyAndFinalizePaystackPayment(reference)
    : { state: "failed" as const, message: "Your payment reference is missing." };
  return <PaymentConfirmation result={result} />;
}

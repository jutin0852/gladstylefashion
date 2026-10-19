import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getPaymentReceipt } from "@/lib/admin/queries/invoices";
import { formatDocumentNumber } from "@/lib/invoice-math";
import { ReceiptSheet } from "@/components/invoice/invoice-document";
import { ExportButtons } from "@/components/invoice/export-buttons";
import { FitToWidth } from "@/components/invoice/fit-to-width";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string; paymentId: string }> }) {
  await requireAdmin();
  const { id, paymentId } = await params;
  const receipt = await getPaymentReceipt(paymentId);
  if (!receipt || receipt.invoice.id !== id) notFound();
  const { payment, invoice } = receipt;
  const number = formatDocumentNumber(payment.receiptNumber);
  return (
    <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <Link href={`/admin/invoices/${id}`} className="text-sm underline">Back to invoice {formatDocumentNumber(invoice.invoiceNumber)}</Link>
        <h1 className="mt-2 text-xl font-semibold">Receipt {number}</h1>
        {payment.voidedAt && <p className="text-sm text-red-600">Voided: {payment.voidReason}</p>}
      </div>
      <ExportButtons targetId="receipt-sheet" filename={`glad-style-receipt-${number}`} />
      <div className="rounded-lg border bg-neutral-100 p-2 sm:p-3">
        <FitToWidth width={760}>
        <ReceiptSheet
          data={{
            number: payment.receiptNumber,
            date: payment.paidAt,
            receivedFrom: payment.receivedFrom,
            amount: payment.amount,
            beingPaymentFor: payment.beingPaymentFor,
            method: payment.method,
            bank: payment.bank,
            chequeNumber: payment.chequeNumber,
            balanceAfter: payment.balanceAfter,
            invoiceNumber: invoice.invoiceNumber,
            voided: Boolean(payment.voidedAt),
          }}
        />
        </FitToWidth>
      </div>
    </section>
  );
}

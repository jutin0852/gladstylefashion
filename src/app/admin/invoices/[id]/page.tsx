import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getInvoiceDetail } from "@/lib/admin/queries/invoices";
import { formatDocumentNumber, methodLabel, todayInLagos } from "@/lib/invoice-math";
import { formatStorePrice } from "@/components/store/currency";
import { InvoiceSheet } from "@/components/invoice/invoice-document";
import { ExportButtons } from "@/components/invoice/export-buttons";
import { FitToWidth } from "@/components/invoice/fit-to-width";
import { InvoiceStatusControls, VoidReceiptButton } from "@/components/admin/invoice-controls";
import { PaymentForm } from "@/components/admin/payment-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getInvoiceDetail(id);
  if (!detail) notFound();
  const { invoice, sections, payments, summary } = detail;
  const isVoid = invoice.status === "void";
  const hasLivePayments = payments.some((payment) => !payment.voidedAt);
  const owing = Number(summary.balance) > 0;
  const number = formatDocumentNumber(invoice.invoiceNumber);

  return (
    <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/invoices" className="text-sm underline">Back to invoices</Link>
          <h1 className="mt-2 text-xl font-semibold">Invoice {number} · {invoice.customerName}</h1>
          <p className="text-sm text-muted-foreground">
            {isVoid ? `Voided: ${invoice.voidReason}` : `${invoice.status === "draft" ? "Draft" : "Sent"} · ${summary.paymentStatus === "paid" ? "Paid in full" : summary.paymentStatus === "part_paid" ? "Part paid" : "Unpaid"}`}
          </p>
        </div>
        {!isVoid && <Button asChild variant="outline"><Link href={`/admin/invoices/${id}/edit`}>Edit invoice</Link></Button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Total</p><p className="mt-1 text-2xl font-semibold">{formatStorePrice(summary.total)}</p></div>
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Received</p><p className="mt-1 text-2xl font-semibold">{formatStorePrice(summary.paid)}</p></div>
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Balance</p><p className="mt-1 text-2xl font-semibold">{formatStorePrice(summary.balance)}</p></div>
      </div>

      <InvoiceStatusControls invoiceId={id} status={invoice.status} canVoid={!hasLivePayments} />

      <div className="space-y-3">
        <h2 className="font-semibold">Send to customer</h2>
        <ExportButtons targetId="invoice-sheet" filename={`glad-style-invoice-${number}`} />
        <div className="rounded-lg border bg-neutral-100 p-2 sm:p-3">
          <FitToWidth width={680}>
          <InvoiceSheet
            data={{
              number: invoice.invoiceNumber,
              customerName: invoice.customerName,
              customerPhone: invoice.customerPhone,
              date: invoice.invoiceDate,
              sections: sections.map((section) => ({ title: section.title, items: section.items.map((item) => ({ description: item.description, quantity: item.quantity, amount: item.amount })) })),
              total: summary.total,
              paid: summary.paid,
              balance: summary.balance,
              notes: invoice.notes,
              payments: payments
                .filter((payment) => !payment.voidedAt)
                .map((payment) => ({ receiptNumber: payment.receiptNumber, date: payment.paidAt, amount: payment.amount, method: payment.method, bank: payment.bank })),
              voided: isVoid,
            }}
          />
          </FitToWidth>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b p-4"><h2 className="font-semibold">Payments &amp; receipts</h2></div>
        {payments.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="divide-y">
            {payments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div className={payment.voidedAt ? "line-through opacity-60" : ""}>
                  <Link className="font-mono underline" href={`/admin/invoices/${id}/receipts/${payment.id}`}>Receipt {formatDocumentNumber(payment.receiptNumber)}</Link>
                  <span className="ml-3">{formatStorePrice(payment.amount)}</span>
                  <span className="ml-3 text-muted-foreground">{methodLabel(payment.method)} · {payment.paidAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}</span>
                </div>
                {payment.voidedAt ? <span className="text-xs text-red-600">Voided: {payment.voidReason}</span> : !isVoid && <VoidReceiptButton paymentId={payment.id} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isVoid && owing && (
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Record a payment</h2>
          <p className="mb-4 text-sm text-muted-foreground">Full or part payment. A numbered receipt is created straight away.</p>
          <PaymentForm invoiceId={id} customerName={invoice.customerName} balance={summary.balance} today={todayInLagos()} />
        </div>
      )}
    </section>
  );
}

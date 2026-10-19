import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getInvoiceList } from "@/lib/admin/queries/invoices";
import { formatDocumentNumber } from "@/lib/invoice-math";
import { formatStorePrice } from "@/components/store/currency";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  part_paid: "bg-amber-100 text-amber-800",
  unpaid: "bg-neutral-100 text-neutral-700",
  void: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<string, string> = { paid: "Paid", part_paid: "Part paid", unpaid: "Unpaid", void: "Void" };

export default async function InvoicesPage() {
  await requireAdmin();
  const invoices = await getInvoiceList();
  return (
    <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Invoices &amp; receipts</h1>
          <p className="text-sm text-muted-foreground">Invoice customers for custom work, record payments, and send receipts.</p>
        </div>
        <Button asChild><Link href="/admin/invoices/new">New invoice</Link></Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">No.</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Balance</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No invoices yet. Create the first one.</td></tr>
            )}
            {invoices.map((invoice) => {
              const status = invoice.status === "void" ? "void" : invoice.paymentStatus;
              return (
                <tr key={invoice.id} className="hover:bg-muted/30">
                  <td className="p-3 font-mono"><Link className="underline" href={`/admin/invoices/${invoice.id}`}>{formatDocumentNumber(invoice.invoiceNumber)}</Link></td>
                  <td className="p-3">{invoice.customerName}</td>
                  <td className="p-3">{invoice.invoiceDate.toLocaleDateString("en-GB", { timeZone: "UTC" })}</td>
                  <td className="p-3 text-right">{formatStorePrice(invoice.total)}</td>
                  <td className="p-3 text-right">{formatStorePrice(invoice.balance)}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

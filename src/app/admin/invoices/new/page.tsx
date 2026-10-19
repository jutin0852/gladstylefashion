import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getNextDocumentNumbers } from "@/lib/admin/queries/invoices";
import { todayInLagos } from "@/lib/invoice-math";
import { InvoiceEditor } from "@/components/admin/invoice-editor";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  await requireAdmin();
  const next = await getNextDocumentNumbers();
  return (
    <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <Link href="/admin/invoices" className="text-sm underline">Back to invoices</Link>
        <h1 className="mt-2 text-xl font-semibold">New invoice</h1>
      </div>
      <InvoiceEditor
        number={next.invoice}
        initial={{ customerName: "", customerPhone: "", customerEmail: "", invoiceDate: todayInLagos(), notes: "", sections: [] }}
      />
    </section>
  );
}

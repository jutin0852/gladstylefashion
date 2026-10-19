import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getInvoiceDetail } from "@/lib/admin/queries/invoices";
import { InvoiceEditor } from "@/components/admin/invoice-editor";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getInvoiceDetail(id);
  if (!detail) notFound();
  if (detail.invoice.status === "void") redirect(`/admin/invoices/${id}`);
  const { invoice, sections, summary } = detail;
  return (
    <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <Link href={`/admin/invoices/${id}`} className="text-sm underline">Back to invoice</Link>
        <h1 className="mt-2 text-xl font-semibold">Edit invoice {String(invoice.invoiceNumber).padStart(7, "0")}</h1>
        {summary.paymentStatus !== "unpaid" && (
          <p className="mt-1 text-sm text-muted-foreground">₦{Number(summary.paid).toLocaleString("en-NG")} has already been received. The total can&apos;t go below that, and receipts already issued stay as they are.</p>
        )}
      </div>
      <InvoiceEditor
        invoiceId={id}
        number={invoice.invoiceNumber}
        initial={{
          customerName: invoice.customerName,
          customerPhone: invoice.customerPhone ?? "",
          customerEmail: invoice.customerEmail ?? "",
          invoiceDate: invoice.invoiceDate.toISOString().slice(0, 10),
          notes: invoice.notes ?? "",
          sections: sections.map((section) => ({ title: section.title, items: section.items.map((item) => ({ description: item.description, quantity: item.quantity, amount: item.amount })) })),
        }}
      />
    </section>
  );
}

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db";
import { documentCounters, invoiceItems, invoicePayments, invoiceSections, invoices } from "../../schema";
import { summarizeInvoice } from "../../invoice-math";

export async function getInvoiceList() {
  const rows = await db.select().from(invoices).orderBy(desc(invoices.invoiceNumber));
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [items, payments] = await Promise.all([
    db.select({ invoiceId: invoiceItems.invoiceId, amount: invoiceItems.amount }).from(invoiceItems).where(inArray(invoiceItems.invoiceId, ids)),
    db.select({ invoiceId: invoicePayments.invoiceId, amount: invoicePayments.amount }).from(invoicePayments).where(and(inArray(invoicePayments.invoiceId, ids), isNull(invoicePayments.voidedAt))),
  ]);
  return rows.map((invoice) => ({
    ...invoice,
    ...summarizeInvoice(
      items.filter((item) => item.invoiceId === invoice.id).map((item) => item.amount),
      payments.filter((payment) => payment.invoiceId === invoice.id).map((payment) => payment.amount),
    ),
  }));
}

export async function getInvoiceDetail(invoiceId: string) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoice) return null;
  const [sectionRows, items, payments] = await Promise.all([
    db.select().from(invoiceSections).where(eq(invoiceSections.invoiceId, invoiceId)).orderBy(asc(invoiceSections.position)),
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)).orderBy(asc(invoiceItems.position)),
    db.select().from(invoicePayments).where(eq(invoicePayments.invoiceId, invoiceId)).orderBy(asc(invoicePayments.receiptNumber)),
  ]);
  const summary = summarizeInvoice(
    items.map((item) => item.amount),
    payments.filter((payment) => !payment.voidedAt).map((payment) => payment.amount),
  );
  const sections = sectionRows.map((section) => ({
    ...section,
    items: items.filter((item) => item.sectionId === section.id),
  }));
  return { invoice, sections, items, payments, summary };
}

export async function getPaymentReceipt(paymentId: string) {
  const [payment] = await db.select().from(invoicePayments).where(eq(invoicePayments.id, paymentId));
  if (!payment) return null;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId));
  return invoice ? { payment, invoice } : null;
}

export async function getNextDocumentNumbers() {
  const rows = await db.select().from(documentCounters);
  const next = (kind: string) => (rows.find((row) => row.kind === kind)?.lastNumber ?? 0) + 1;
  return { invoice: next("invoice"), receipt: next("receipt") };
}

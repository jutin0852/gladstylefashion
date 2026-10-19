"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { transactionDb } from "@/lib/transaction-db";
import { documentCounters, invoiceItems, invoicePayments, invoiceSections, invoices } from "@/lib/schema";
import { formatDocumentNumber, normalizeAmount, summarizeInvoice } from "@/lib/invoice-math";
import { invoiceInputSchema, paymentInputSchema, type InvoiceInput, type PaymentInput } from "@/lib/invoice-input";
import { koboToNairaDecimal, parseNairaToKobo } from "@/lib/money";

type Tx = Parameters<Parameters<typeof transactionDb.transaction>[0]>[0];
type Result = { success: true; message: string; id?: string } | { success: false; message: string };

function fail(error: unknown): Result {
  if (error instanceof Error) return { success: false, message: error.message };
  return { success: false, message: "Something went wrong. Please try again." };
}

function firstIssue(error: { issues: { message: string }[] }): Result {
  return { success: false, message: error.issues[0]?.message ?? "Check the form and try again." };
}

function toDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

async function nextNumber(tx: Tx, kind: "invoice" | "receipt") {
  const [row] = await tx
    .insert(documentCounters)
    .values({ kind, lastNumber: 1 })
    .onConflictDoUpdate({
      target: documentCounters.kind,
      set: { lastNumber: sql`${documentCounters.lastNumber} + 1`, updatedAt: new Date() },
    })
    .returning({ lastNumber: documentCounters.lastNumber });
  return row.lastNumber;
}

type ParsedSections = ReturnType<typeof invoiceInputSchema.parse>["sections"];

/** Writes garment sections and their items; returns the invoice total. */
async function writeSections(tx: Tx, invoiceId: string, sections: ParsedSections) {
  let total = BigInt(0);
  let itemPosition = 0;
  for (const [sectionIndex, section] of sections.entries()) {
    const [row] = await tx.insert(invoiceSections).values({
      invoiceId,
      position: sectionIndex + 1,
      title: section.title ?? null,
    }).returning({ id: invoiceSections.id });
    const items = section.items.map((item) => ({
      invoiceId,
      sectionId: row.id,
      position: ++itemPosition,
      description: item.description,
      quantity: item.quantity ?? null,
      amount: normalizeAmount(item.amount),
    }));
    total += items.reduce((sum, item) => sum + parseNairaToKobo(item.amount), BigInt(0));
    await tx.insert(invoiceItems).values(items);
  }
  return koboToNairaDecimal(total);
}

async function livePaid(tx: Tx, invoiceId: string) {
  const rows = await tx
    .select({ amount: invoicePayments.amount })
    .from(invoicePayments)
    .where(and(eq(invoicePayments.invoiceId, invoiceId), isNull(invoicePayments.voidedAt)));
  return rows.map((row) => row.amount);
}

async function lockInvoice(tx: Tx, invoiceId: string) {
  const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId)).for("update");
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status === "void") throw new Error("This invoice has been voided.");
  return invoice;
}

function refresh(invoiceId?: string) {
  revalidatePath("/admin/invoices");
  if (invoiceId) revalidatePath(`/admin/invoices/${invoiceId}`);
}

export async function createInvoice(input: InvoiceInput): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = invoiceInputSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  try {
    const id = await transactionDb.transaction(async (tx) => {
      const invoiceNumber = await nextNumber(tx, "invoice");
      const [invoice] = await tx.insert(invoices).values({
        invoiceNumber,
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerEmail: parsed.data.customerEmail,
        invoiceDate: toDate(parsed.data.invoiceDate),
        notes: parsed.data.notes,
        totalAmount: "0",
        createdByUserId: admin.id,
      }).returning({ id: invoices.id });
      const total = await writeSections(tx, invoice.id, parsed.data.sections);
      await tx.update(invoices).set({ totalAmount: total }).where(eq(invoices.id, invoice.id));
      return invoice.id;
    });
    refresh();
    return { success: true, message: "Invoice created.", id };
  } catch (error) {
    return fail(error);
  }
}

/** Invoices stay editable after they are sent, until voided. */
export async function updateInvoice(invoiceId: string, input: InvoiceInput): Promise<Result> {
  await requireAdmin();
  const parsed = invoiceInputSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  try {
    await transactionDb.transaction(async (tx) => {
      await lockInvoice(tx, invoiceId);
      const paid = summarizeInvoice([], await livePaid(tx, invoiceId)).paid;
      await tx.delete(invoiceSections).where(eq(invoiceSections.invoiceId, invoiceId));
      const total = await writeSections(tx, invoiceId, parsed.data.sections);
      if (parseNairaToKobo(total) < parseNairaToKobo(paid)) {
        throw new Error(`The total cannot be lower than the ${paid} already received. Void the receipt first if it was a mistake.`);
      }
      await tx.update(invoices).set({
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone ?? null,
        customerEmail: parsed.data.customerEmail ?? null,
        invoiceDate: toDate(parsed.data.invoiceDate),
        notes: parsed.data.notes ?? null,
        totalAmount: total,
        updatedAt: new Date(),
      }).where(eq(invoices.id, invoiceId));
    });
    refresh(invoiceId);
    return { success: true, message: "Invoice updated." };
  } catch (error) {
    return fail(error);
  }
}

export async function markInvoiceSent(invoiceId: string): Promise<Result> {
  await requireAdmin();
  try {
    await transactionDb.transaction(async (tx) => {
      const invoice = await lockInvoice(tx, invoiceId);
      if (invoice.status === "draft") {
        await tx.update(invoices).set({ status: "sent", updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
      }
    });
    refresh(invoiceId);
    return { success: true, message: "Marked as sent." };
  } catch (error) {
    return fail(error);
  }
}

export async function voidInvoice(invoiceId: string, reason: string): Promise<Result> {
  await requireAdmin();
  const cleanReason = reason.trim();
  if (!cleanReason) return { success: false, message: "Give a reason for voiding this invoice." };
  try {
    await transactionDb.transaction(async (tx) => {
      await lockInvoice(tx, invoiceId);
      if ((await livePaid(tx, invoiceId)).length > 0) {
        throw new Error("This invoice has payments. Void those receipts first.");
      }
      await tx.update(invoices).set({ status: "void", voidedAt: new Date(), voidReason: cleanReason, updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
    });
    refresh(invoiceId);
    return { success: true, message: "Invoice voided." };
  } catch (error) {
    return fail(error);
  }
}

/** Records money received and issues the next numbered receipt. */
export async function recordPayment(input: PaymentInput): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = paymentInputSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const data = parsed.data;
  try {
    const id = await transactionDb.transaction(async (tx) => {
      const invoice = await lockInvoice(tx, data.invoiceId);
      const items = await tx.select({ amount: invoiceItems.amount }).from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));
      const before = summarizeInvoice(items.map((item) => item.amount), await livePaid(tx, invoice.id));
      const amount = parseNairaToKobo(data.amount);
      const balance = parseNairaToKobo(before.balance);
      if (amount > balance) {
        throw new Error(`That is more than the ${before.balance} still owed on this invoice.`);
      }
      const receiptNumber = await nextNumber(tx, "receipt");
      const [payment] = await tx.insert(invoicePayments).values({
        invoiceId: invoice.id,
        receiptNumber,
        amount: koboToNairaDecimal(amount),
        paidAt: toDate(data.paidAt),
        method: data.method,
        bank: data.method === "cash" ? null : data.bank,
        chequeNumber: data.chequeNumber,
        receivedFrom: data.receivedFrom,
        beingPaymentFor: data.beingPaymentFor ?? `Invoice ${formatDocumentNumber(invoice.invoiceNumber)}`,
        balanceAfter: koboToNairaDecimal(balance - amount),
        recordedByUserId: admin.id,
      }).returning({ id: invoicePayments.id });
      return payment.id;
    });
    refresh(data.invoiceId);
    return { success: true, message: "Payment recorded and receipt issued.", id };
  } catch (error) {
    return fail(error);
  }
}

export async function voidPayment(paymentId: string, reason: string): Promise<Result> {
  await requireAdmin();
  const cleanReason = reason.trim();
  if (!cleanReason) return { success: false, message: "Give a reason for voiding this receipt." };
  try {
    const invoiceId = await transactionDb.transaction(async (tx) => {
      const [payment] = await tx.select().from(invoicePayments).where(eq(invoicePayments.id, paymentId));
      if (!payment) throw new Error("Receipt not found.");
      await lockInvoice(tx, payment.invoiceId);
      if (payment.voidedAt) throw new Error("This receipt is already voided.");
      await tx.update(invoicePayments).set({ voidedAt: new Date(), voidReason: cleanReason }).where(eq(invoicePayments.id, paymentId));
      return payment.invoiceId;
    });
    refresh(invoiceId);
    return { success: true, message: "Receipt voided." };
  } catch (error) {
    return fail(error);
  }
}

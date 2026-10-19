"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { createInvoice, updateInvoice } from "@/app/actions/invoices";
import { nairaToWords } from "@/lib/invoice-math";
import { formatKobo, parseNairaToKobo } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ItemRow { key: number; quantity: string; description: string; amount: string }
interface SectionRow { key: number; title: string; items: ItemRow[] }

export interface InvoiceEditorInitial {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  invoiceDate: string;
  notes: string;
  sections: { title: string | null; items: { description: string; quantity: number | null; amount: string }[] }[];
}

const wholeText = (value: string) => String(Number(value));
const digitsOnly = (value: string) => value.replace(/\D/g, "");

function rowTotal(items: ItemRow[]) {
  return items.reduce<bigint>((sum, item) => sum + (item.amount ? parseNairaToKobo(item.amount) : BigInt(0)), BigInt(0));
}

export function InvoiceEditor({ invoiceId, number, initial }: { invoiceId?: string; number: number; initial: InvoiceEditorInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState(initial.customerName);
  const [customerPhone, setCustomerPhone] = useState(initial.customerPhone);
  const [customerEmail, setCustomerEmail] = useState(initial.customerEmail);
  const [invoiceDate, setInvoiceDate] = useState(initial.invoiceDate);
  const [notes, setNotes] = useState(initial.notes);

  // One counter hands out unique React keys for every garment and item row.
  const [counter, setCounter] = useState(1000);
  const [sections, setSections] = useState<SectionRow[]>(() => {
    let key = 0;
    if (initial.sections.length === 0) {
      return [{ key: key++, title: "", items: [{ key: key++, quantity: "", description: "", amount: "" }, { key: key++, quantity: "", description: "", amount: "" }] }];
    }
    return initial.sections.map((section) => ({
      key: key++,
      title: section.title ?? "",
      items: section.items.map((item) => ({ key: key++, quantity: item.quantity ? String(item.quantity) : "", description: item.description, amount: wholeText(item.amount) })),
    }));
  });

  const nextKey = () => {
    setCounter((value) => value + 1);
    return counter;
  };

  const total = sections.reduce<bigint>((sum, section) => sum + rowTotal(section.items), BigInt(0));

  function patchSection(sectionKey: number, patch: Partial<SectionRow>) {
    setSections((current) => current.map((section) => (section.key === sectionKey ? { ...section, ...patch } : section)));
  }

  function patchItem(sectionKey: number, itemKey: number, patch: Partial<ItemRow>) {
    setSections((current) =>
      current.map((section) =>
        section.key === sectionKey
          ? { ...section, items: section.items.map((item) => (item.key === itemKey ? { ...item, ...patch } : item)) }
          : section,
      ),
    );
  }

  function addItem(sectionKey: number) {
    const key = nextKey();
    setSections((current) => current.map((section) => (section.key === sectionKey ? { ...section, items: [...section.items, { key, quantity: "", description: "", amount: "" }] } : section)));
  }

  function removeItem(sectionKey: number, itemKey: number) {
    setSections((current) =>
      current.map((section) =>
        section.key === sectionKey && section.items.length > 1 ? { ...section, items: section.items.filter((item) => item.key !== itemKey) } : section,
      ),
    );
  }

  function addSection() {
    const sectionKey = nextKey();
    const itemKey = sectionKey + 1;
    setCounter((value) => value + 1);
    setSections((current) => [...current, { key: sectionKey, title: "", items: [{ key: itemKey, quantity: "", description: "", amount: "" }] }]);
  }

  function removeSection(sectionKey: number) {
    setSections((current) => (current.length > 1 ? current.filter((section) => section.key !== sectionKey) : current));
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const filled = sections
      .map((section) => ({
        title: section.title,
        items: section.items
          .filter((item) => item.description.trim() || item.amount.trim())
          .map((item) => ({ description: item.description, quantity: item.quantity ? Number(item.quantity) : null, amount: item.amount })),
      }))
      .filter((section) => section.items.length > 0);
    if (filled.length === 0) return setError("Add at least one item with a price.");
    const input = { customerName, customerPhone, customerEmail, invoiceDate, notes, sections: filled };
    startTransition(async () => {
      const result = invoiceId ? await updateInvoice(invoiceId, input) : await createInvoice(input);
      if (!result.success) return setError(result.message);
      router.push(`/admin/invoices/${invoiceId ?? result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Customer</h2>
          <p className="font-mono text-sm text-muted-foreground">№ {String(number).padStart(7, "0")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer name</Label>
          <Input id="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer's full name" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone (optional)</Label>
            <Input id="customerPhone" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} inputMode="tel" placeholder="Phone number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceDate">Date</Label>
            <Input id="invoiceDate" type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email (optional)</Label>
          <Input id="customerEmail" type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="Email address" />
        </div>
      </div>

      {sections.map((section, sectionIndex) => (
        <div key={section.key} className="rounded-lg border bg-card">
          <div className="flex items-end gap-2 border-b p-4 sm:p-5">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor={`garment-${section.key}`}>Garment {sectionIndex + 1}</Label>
              <Input id={`garment-${section.key}`} value={section.title} onChange={(event) => patchSection(section.key, { title: event.target.value })} placeholder="Garment name or style (optional)" />
            </div>
            {sections.length > 1 && (
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove garment ${sectionIndex + 1}`} onClick={() => removeSection(section.key)}>
                <IconTrash className="size-4" />
              </Button>
            )}
          </div>

          <div className="hidden grid-cols-[28px_1fr_72px_160px_40px] gap-2 border-b bg-muted/40 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Item</span>
            <span>Description of Goods</span>
            <span>Qty.</span>
            <span className="text-right">Amount ₦</span>
            <span />
          </div>
          <div className="divide-y">
            {section.items.map((item, itemIndex) => {
              const fieldId = `g${section.key}-i${item.key}`;
              return (
                <div key={item.key} className="grid grid-cols-[84px_1fr] gap-x-2 gap-y-3 p-4 sm:grid-cols-[28px_1fr_72px_160px_40px] sm:items-center sm:gap-y-0 sm:px-5">
                  <p className="col-span-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:hidden">Item {itemIndex + 1}</p>
                  <span className="hidden text-sm text-muted-foreground sm:block">{itemIndex + 1}</span>
                  <div className="col-span-2 space-y-1 sm:col-span-1 sm:space-y-0">
                    <Label htmlFor={`${fieldId}-desc`} className="text-xs sm:sr-only">Description of Goods</Label>
                    <Input
                      id={`${fieldId}-desc`}
                      value={item.description}
                      onChange={(event) => patchItem(section.key, item.key, { description: event.target.value })}
                      placeholder="Describe the item or work"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-0">
                    <Label htmlFor={`${fieldId}-qty`} className="text-xs sm:sr-only">Qty.</Label>
                    <Input
                      id={`${fieldId}-qty`}
                      value={item.quantity}
                      onChange={(event) => patchItem(section.key, item.key, { quantity: digitsOnly(event.target.value) })}
                      inputMode="numeric"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-end gap-2 sm:contents">
                    <div className="space-y-1 sm:space-y-0">
                      <Label htmlFor={`${fieldId}-amount`} className="text-xs sm:sr-only">Amount ₦</Label>
                      <Input
                        id={`${fieldId}-amount`}
                        value={item.amount ? Number(item.amount).toLocaleString("en-NG") : ""}
                        onChange={(event) => patchItem(section.key, item.key, { amount: digitsOnly(event.target.value) })}
                        inputMode="numeric"
                        placeholder="Amount"
                        className="sm:text-right"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove item ${itemIndex + 1}`} onClick={() => removeItem(section.key, item.key)} disabled={section.items.length === 1}>
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 border-t p-4 sm:px-5">
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(section.key)}>
              <IconPlus className="size-4" /> Add item
            </Button>
            <p className="text-sm">Subtotal <strong className="ml-1">{formatKobo(rowTotal(section.items))}</strong></p>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={addSection}>
        <IconPlus className="size-4" /> Add another garment
      </Button>

      <div className="space-y-1 rounded-lg border bg-muted/40 p-4 text-right sm:p-5">
        <p className="text-sm text-muted-foreground">Invoice total</p>
        <p className="text-3xl font-semibold">{formatKobo(total)}</p>
        <p className="text-sm italic text-muted-foreground">{nairaToWords(total)}</p>
      </div>

      <div className="space-y-2 rounded-lg border bg-card p-4 sm:p-5">
        <Label htmlFor="notes">Note on the invoice (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Anything the customer should know" />
      </div>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">{pending ? "Saving..." : invoiceId ? "Save changes" : "Create invoice"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>Cancel</Button>
      </div>
    </form>
  );
}

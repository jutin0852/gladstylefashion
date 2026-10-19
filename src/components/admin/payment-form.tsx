"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordPayment } from "@/app/actions/invoices";
import { BANKS, INVOICE_METHODS, METHOD_LABELS } from "@/lib/invoice-math";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentForm({ invoiceId, customerName, balance, today }: { invoiceId: string; customerName: string; balance: string; today: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(String(Number(balance)));
  const [paidAt, setPaidAt] = useState(today);
  const [method, setMethod] = useState<(typeof INVOICE_METHODS)[number]>("transfer");
  const [bank, setBank] = useState<(typeof BANKS)[number] | "">("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [receivedFrom, setReceivedFrom] = useState(customerName);
  const [beingPaymentFor, setBeingPaymentFor] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await recordPayment({ invoiceId, amount, paidAt, method, bank: method === "cash" ? "" : bank, chequeNumber, receivedFrom, beingPaymentFor });
      if (!result.success) return setError(result.message);
      router.push(`/admin/invoices/${invoiceId}/receipts/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="pay-amount">Amount received (₦)</Label>
        <Input id="pay-amount" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} inputMode="numeric" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pay-date">Date received</Label>
        <Input id="pay-date" type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pay-method">How was it paid?</Label>
        <select id="pay-method" value={method} onChange={(event) => setMethod(event.target.value as typeof method)} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
          {INVOICE_METHODS.map((value) => <option key={value} value={value}>{METHOD_LABELS[value]}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pay-from">Received from</Label>
        <Input id="pay-from" value={receivedFrom} onChange={(event) => setReceivedFrom(event.target.value)} required />
      </div>
      {method !== "cash" && (
        <div className="space-y-2">
          <Label htmlFor="pay-bank">Which bank was it paid into?</Label>
          <select id="pay-bank" value={bank} onChange={(event) => setBank(event.target.value as typeof bank)} required className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
            <option value="">Select bank</option>
            {BANKS.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      )}
      {method === "cheque" && (
        <div className="space-y-2">
          <Label htmlFor="pay-cheque">Cheque no.</Label>
          <Input id="pay-cheque" value={chequeNumber} onChange={(event) => setChequeNumber(event.target.value)} />
        </div>
      )}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="pay-for">Being payment for (optional)</Label>
        <Input id="pay-for" value={beingPaymentFor} onChange={(event) => setBeingPaymentFor(event.target.value)} placeholder="What this payment is for" />
      </div>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Recording..." : "Record payment & issue receipt"}</Button>
      </div>
    </form>
  );
}

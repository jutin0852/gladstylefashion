"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoice, markInvoiceSent, voidInvoice, voidPayment } from "@/app/actions/invoices";
import { Button } from "@/components/ui/button";

type ActionResult = { success: boolean; message: string };

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function run(task: () => Promise<ActionResult>) {
    setMessage("");
    startTransition(async () => {
      const result = await task();
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }
  return { pending, message, run };
}

export function InvoiceStatusControls({ invoiceId, status, canVoid }: { invoiceId: string; status: string; canVoid: boolean }) {
  const { pending, message, run } = useAction();
  if (status === "void") return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => markInvoiceSent(invoiceId))}>Mark as sent</Button>
      )}
      {canVoid && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            const reason = window.prompt("Why are you voiding this invoice?");
            if (reason) run(() => voidInvoice(invoiceId, reason));
          }}
        >
          Void invoice
        </Button>
      )}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

export function VoidReceiptButton({ paymentId }: { paymentId: string }) {
  const { pending, message, run } = useAction();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        className="text-sm underline disabled:opacity-50"
        onClick={() => {
          const reason = window.prompt("Why are you voiding this receipt? (e.g. entered by mistake)");
          if (reason) run(() => voidPayment(paymentId, reason));
        }}
      >
        Void
      </button>
      {message && <span className="text-xs text-red-600">{message}</span>}
    </span>
  );
}

export function DeleteInvoiceButton({ invoiceId, invoiceNumber, receiptCount }: { invoiceId: string; invoiceNumber: string; receiptCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function remove() {
    const receipts = receiptCount > 0 ? ` and its ${receiptCount} receipt${receiptCount === 1 ? "" : "s"}` : "";
    if (!window.confirm(`Delete invoice ${invoiceNumber}${receipts}?\n\nThis permanently removes it and cannot be undone.`)) return;
    setMessage("");
    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);
      if (!result.success) return setMessage(result.message);
      router.push("/admin/invoices");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" disabled={pending} onClick={remove} className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800">
        {pending ? "Deleting..." : "Delete invoice"}
      </Button>
      {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
    </div>
  );
}

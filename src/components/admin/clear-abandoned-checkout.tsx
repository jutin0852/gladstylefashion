"use client";

import { useState, useTransition } from "react";
import { clearAbandonedCheckout } from "@/app/actions/updateOrder";

export function ClearAbandonedCheckout({ orderId }: { orderId: string }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function clear() {
    if (!window.confirm("Remove this unpaid checkout record? This permanently removes the order and its line items.")) return;
    startTransition(() => {
      void clearAbandonedCheckout(orderId).then((result) => {
        if (result.success) window.location.assign("/admin/orders");
        else setMessage(result.message || "Could not remove this checkout record.");
      });
    });
  }

  return <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
    <h2 className="font-medium">Unpaid checkout</h2>
    <p className="mt-2 text-sm text-muted-foreground">Remove an abandoned checkout once you are sure the customer did not complete payment.</p>
    <button type="button" disabled={pending} onClick={clear} className="mt-4 rounded-md border border-destructive px-3 py-2 text-sm text-destructive disabled:opacity-50">{pending ? "Removing…" : "Remove checkout record"}</button>
    {message && <p role="status" className="mt-3 text-sm text-destructive">{message}</p>}
  </div>;
}

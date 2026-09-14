"use client";

import { useState, useTransition } from "react";
import { changeOrderStatus } from "../../app/actions/updateOrder";

const transitions: Record<string, string[]> = { pending: ["processing", "cancelled"], processing: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [] };

export function FulfillmentControls({ orderId, status, carrier: initialCarrier, trackingNumber: initialTrackingNumber }: { orderId: string; status: string; carrier: string | null; trackingNumber: string | null }) {
  const [carrier, setCarrier] = useState(initialCarrier || "");
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const choices = transitions[status] || [];
  if (!choices.length) return <p className="text-sm text-muted-foreground">No further fulfilment actions are available.</p>;
  function update(nextStatus: string) {
    if (nextStatus === "cancelled" && !window.confirm("Cancel this order and return all item quantities to stock?")) return;
    startTransition(() => { void changeOrderStatus(orderId, nextStatus, { carrier, trackingNumber }).then((result) => setMessage(result.success ? "Order updated. Refreshing…" : result.message || "Could not update order.")); });
  }
  return <div className="space-y-3"><label className="block text-sm"><span className="mb-1 block text-muted-foreground">Carrier</span><input value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="e.g. DHL" className="w-full rounded-md border bg-background px-3 py-2" /></label><label className="block text-sm"><span className="mb-1 block text-muted-foreground">Tracking number</span><input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Tracking number" className="w-full rounded-md border bg-background px-3 py-2" /></label><div className="flex flex-wrap gap-2">{choices.map((choice) => <button key={choice} disabled={isPending} onClick={() => update(choice)} className={choice === "cancelled" ? "rounded-md border border-destructive px-3 py-2 text-sm text-destructive" : "rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"}>{choice === "shipped" ? "Mark shipped" : choice === "delivered" ? "Mark delivered" : choice === "processing" ? "Start processing" : "Cancel order"}</button>)}</div>{message && <p className="text-sm text-muted-foreground">{message}</p>}</div>;
}

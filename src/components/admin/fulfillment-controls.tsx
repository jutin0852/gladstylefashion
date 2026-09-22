"use client";

import { useState, useTransition } from "react";
import { changeOrderStatus } from "@/app/actions/updateOrder";

const transitions: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const actionLabels: Record<string, string> = {
  processing: "Start processing",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
};

export function FulfillmentControls({ orderId, status }: { orderId: string; status: string }) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const choices = transitions[status] || [];

  if (!choices.length) {
    return <p className="text-sm text-muted-foreground">No further fulfilment actions are available.</p>;
  }

  function update(nextStatus: string) {
    const confirmation =
      nextStatus === "shipped"
        ? "Mark this order as shipped? The customer will see that it is on the way."
        : nextStatus === "cancelled"
          ? "Cancel this order and return all item quantities to stock?"
          : null;

    if (confirmation && !window.confirm(confirmation)) return;

    startTransition(() => {
      void changeOrderStatus(orderId, nextStatus).then((result) => {
        setMessage(result.success ? result.message || "Order updated. Refreshing…" : result.message || "Could not update order.");
      });
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-5 text-muted-foreground">
        Start processing when the order is being prepared. The customer receives an email update at that point.
      </p>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            disabled={isPending}
            onClick={() => update(choice)}
            className={
              choice === "cancelled"
                ? "rounded-md border border-destructive px-3 py-2 text-sm text-destructive disabled:opacity-60"
                : "rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
            }
          >
            {actionLabels[choice]}
          </button>
        ))}
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}

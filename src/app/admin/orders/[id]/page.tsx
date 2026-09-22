import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { FulfillmentControls } from "@/components/admin/fulfillment-controls";
import { ClearAbandonedCheckout } from "@/components/admin/clear-abandoned-checkout";
import { OrderItemsList } from "@/components/admin/order-items-list";
import { formatStorePrice } from "@/components/store/currency";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      fulfillmentEvents: { orderBy: (event, { desc }) => [desc(event.createdAt)] },
    },
  });

  if (!order) notFound();

  const address = order.shippingAddress;
  const canClear =
    order.status === "pending" &&
    order.paymentStatus !== "paid" &&
    (order.paymentStatus === "failed" || !order.createdAt || Date.now() - order.createdAt.getTime() >= 30 * 60_000);

  return (
    <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <Link href="/admin/orders" className="text-sm underline">
          Back to orders
        </Link>
        <h1 className="mt-3 text-xl font-semibold">{order.orderNumber}</h1>
        <p className="text-sm text-muted-foreground">
          Placed {order.createdAt ? new Date(order.createdAt).toLocaleString("en-GB") : "—"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Customer</p>
          <Link href={`/admin/customers/${encodeURIComponent(order.customerEmail)}`} className="mt-2 block font-medium underline">
            {order.customerName}
          </Link>
          <p className="mt-1 break-all text-sm">{order.customerEmail}</p>
          {order.customerPhone ? <p className="mt-1 text-sm">{order.customerPhone}</p> : null}
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Fulfilment status</p>
          <p className="mt-2 text-lg font-semibold capitalize">{order.status}</p>
          <p className="mt-1 text-sm capitalize text-muted-foreground">Payment: {order.paymentStatus || "pending"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Order total</p>
          <p className="mt-2 text-lg font-semibold">{formatStorePrice(order.totalAmount)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <OrderItemsList items={order.items} />

        <aside className="space-y-6">
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Fulfilment</h2>
            <div className="mt-3">
              <FulfillmentControls orderId={order.id} status={order.status} />
            </div>
          </div>

          {canClear ? <ClearAbandonedCheckout orderId={order.id} /> : null}

          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Delivery address</h2>
            {address ? (
              <address className="mt-3 whitespace-pre-line text-sm not-italic text-muted-foreground">
                {address.street}{"\n"}
                {address.city}, {address.state}{"\n"}
                {address.postalCode}{"\n"}
                {address.country}
              </address>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No delivery address recorded.</p>
            )}
            {order.notes ? (
              <>
                <h2 className="mt-6 font-medium">Order notes</h2>
                <p className="mt-3 text-sm text-muted-foreground">{order.notes}</p>
              </>
            ) : null}
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Fulfilment history</h2>
            {order.fulfillmentEvents.length ? (
              <ol className="mt-3 space-y-3">
                {order.fulfillmentEvents.map((event) => (
                  <li key={event.id}>
                    <p className="text-sm font-medium capitalize">{event.status}</p>
                    <p className="text-xs text-muted-foreground">{event.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.createdAt ? new Date(event.createdAt).toLocaleString("en-GB") : "—"}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No fulfilment events yet.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

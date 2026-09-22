import { formatStorePrice } from "@/components/store/currency";

type OrderItem = {
  id: string;
  productName: string;
  productImage: string | null;
  size: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  customizations: Record<string, unknown> | null;
};

function formatCustomizations(customizations: OrderItem["customizations"]) {
  if (!customizations) return [];

  return Object.entries(customizations)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `${label.replace(/([A-Z])/g, " $1")}: ${String(value)}`);
}

export function OrderItemsList({ items }: { items: OrderItem[] }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="font-medium">Items in this order</h2>
      </div>
      <div className="divide-y">
        {items.map((item) => {
          const customizations = formatCustomizations(item.customizations);

          return (
            <article key={item.id} className="p-4">
              <div className="flex gap-3">
                {item.productImage ? (
                  // Product images originate from the catalogue and may use an external image host.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.productImage} alt="" className="h-16 w-16 shrink-0 rounded-md border object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium leading-5">{item.productName}</p>
                  <p className="mt-1 text-sm font-medium">{formatStorePrice(item.totalPrice)}</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Size</dt>
                  <dd className="mt-1 font-medium">{item.size || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Quantity</dt>
                  <dd className="mt-1 font-medium">{item.quantity}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Each</dt>
                  <dd className="mt-1 font-medium">{formatStorePrice(item.unitPrice)}</dd>
                </div>
              </dl>

              {customizations.length ? (
                <p className="mt-3 break-words text-xs leading-5 text-muted-foreground">{customizations.join(" · ")}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

import { requireAdmin } from "../../../lib/admin-auth";
import { getAllAdminProducts } from "../../../lib/admin/queries/product";
import Link from "next/link";

export default async function ProductReviewPage() {
  await requireAdmin();
  const products = await getAllAdminProducts();
  const missingImages = products.filter(
    (product) => product.images.length === 0,
  );
  const missingDescriptions = products.filter(
    (product) => !product.description?.trim(),
  );
  const missingSku = products.filter((product) => !product.sku);
  const unpublished = products.filter((product) => !product.isActive);

  const checks = [
    [
      "Missing product images",
      missingImages.length,
      "Add media before publishing products.",
    ],
    [
      "Missing descriptions",
      missingDescriptions.length,
      "Give customers enough detail to decide.",
    ],
    [
      "Missing SKUs",
      missingSku.length,
      "Add a unique SKU for fulfillment and stock tracking.",
    ],
    [
      "Draft products",
      unpublished.length,
      "These products are hidden from the storefront.",
    ],
  ];

  return (
    <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <h1 className="text-xl font-semibold">Product review</h1>
        <p className="text-sm text-muted-foreground">
          Catalog health checks before products go live.
        </p>
      </div>
      <div className="grid gap-4 @xl/main:grid-cols-2">
        {checks.map(([title, count, description]) => (
          <div key={title} className="rounded-lg border bg-card p-5">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-medium">{title}</h2>
              <span
                className={`text-2xl font-semibold ${count ? "text-destructive" : "text-emerald-600"}`}
              >
                {count}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border">
        <div className="border-b p-5">
          <h2 className="font-medium">Review queue</h2>
        </div>
        <div className="divide-y">
          {products
            .filter(
              (product) =>
                !product.isActive ||
                !product.images.length ||
                !product.description?.trim() ||
                !product.sku,
            )
            .map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{product.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      !product.isActive && "Draft",
                      !product.images.length && "No images",
                      !product.description?.trim() && "No description",
                      !product.sku && "No SKU",
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                </div>
                <Link
                  href={`/admin/product-list/${product.id}`}
                  className="text-sm underline"
                >
                  Edit product
                </Link>
              </div>
            ))}
          {products.every(
            (product) =>
              product.isActive &&
              product.images.length &&
              product.description?.trim() &&
              product.sku,
          ) && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Everything is ready for review.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

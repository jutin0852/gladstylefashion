import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getAdminProductById } from "../../../../lib/admin/queries/product";
import { ProductEditForm } from "../../../../components/admin/product-edit-form";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const product = await getAdminProductById((await params).id);
  if (!product) notFound();
  return (
    <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <h1 className="text-xl font-semibold">Edit product</h1>
        <p className="text-sm text-muted-foreground">
          Update product details, availability, and merchandising.
        </p>
      </div>
      <ProductEditForm product={product} />
    </section>
  );
}

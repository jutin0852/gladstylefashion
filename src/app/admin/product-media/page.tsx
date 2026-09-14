import { ProductMediaLibrary } from "../../../components/admin/product-media-library";
import { requireAdmin } from "../../../lib/admin-auth";
import { getAllAdminProducts } from "../../../lib/admin/queries/product";

export default async function ProductMediaPage() {
  await requireAdmin();
  const products = await getAllAdminProducts();
  return <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6"><div><h1 className="text-xl font-semibold">Product media</h1><p className="text-sm text-muted-foreground">Review every uploaded product image and remove outdated media.</p></div><ProductMediaLibrary products={products} /></section>;
}

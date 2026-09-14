import { ProductManagement } from "../../../components/admin/product-management";
import { requireAdmin } from "../../../lib/admin-auth";
import { getAllAdminProducts } from "../../../lib/admin/queries/product";

export default async function ProductListPage() {
  await requireAdmin();
  const products = await getAllAdminProducts();
  return <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6"><div><h1 className="text-xl font-semibold">Product list</h1><p className="text-sm text-muted-foreground">Manage your catalog, availability, and featured products.</p></div><ProductManagement products={products} /></section>;
}

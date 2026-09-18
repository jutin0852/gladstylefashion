import { getAllProducts } from "../lib/admin/queries/product";
import Storefront from "../components/store/storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getAllProducts();

  return <Storefront products={products} />;
}

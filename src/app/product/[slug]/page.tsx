import { notFound } from "next/navigation";
import ProductDetail from "../../../components/store/product-detail";
import { getProductBySlug } from "../../../lib/admin/queries/product";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}

import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductDetail from "../../../components/store/product-detail";
import { getProductBySlug } from "../../../lib/admin/queries/product";

export const dynamic = "force-dynamic";

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

  return <Suspense fallback={<main className="min-h-screen bg-white" />}><ProductDetail product={product} /></Suspense>;
}

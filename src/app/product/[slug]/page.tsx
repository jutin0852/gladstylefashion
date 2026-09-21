import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import ProductDetail from "../../../components/store/product-detail";
import { getProductBySlug } from "../../../lib/admin/queries/product";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product unavailable", robots: { index: false, follow: false } };
  const description = (product.description || `${product.productName} from Glad Style Fashion.`).slice(0, 160);
  const image = product.images[0]?.imageUrl;
  const imageUrl = image ? new URL(image, getSiteUrl()).toString() : undefined;
  return {
    title: product.productName,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.productName} | Glad Style Fashion`,
      description,
      url: `/product/${product.slug}`,
      images: imageUrl ? [{ url: imageUrl, alt: product.images[0]?.altText || product.productName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.productName} | Glad Style Fashion`,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

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

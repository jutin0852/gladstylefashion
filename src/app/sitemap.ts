import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/admin/queries/product";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const products = await getAllProducts();
  const pages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/shipping-delivery`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/returns-exchanges`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
  return [
    ...pages,
    ...products.map((product) => ({
      url: `${siteUrl}/product/${product.slug}`,
      lastModified: product.updatedAt || product.createdAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

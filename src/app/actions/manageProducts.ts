"use server";

import { requireAdmin } from "../../lib/admin-auth";
import { db } from "../../lib/db";
import { productImages, products } from "../../lib/schema";
import { and, eq } from "drizzle-orm";

export async function updateProductStatus(
  productId: string,
  field: "isActive" | "featured",
  value: boolean,
) {
  await requireAdmin();
  await db
    .update(products)
    .set({ [field]: value, updatedAt: new Date() })
    .where(eq(products.id, productId));
  return { success: true };
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, productId));
  return { success: true };
}

export async function deleteProductImage(imageId: number) {
  await requireAdmin();
  await db.delete(productImages).where(eq(productImages.id, imageId));
  return { success: true };
}

export async function updateProduct(
  productId: string,
  values: {
    productName: string;
    description?: string;
    price: number;
    costPrice?: number;
    inventoryCount?: number;
    sku?: string;
    categoryId?: string;
    sizes?: string[];
    materials?: string;
    careInstructions?: string;
    isActive: boolean;
    featured: boolean;
  },
) {
  await requireAdmin();
  const name = values.productName.trim();
  if (
    name.length < 3 ||
    values.price <= 0 ||
    (values.inventoryCount ?? 0) < 0
  ) {
    return { success: false, message: "Please enter valid product details." };
  }
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const duplicate = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.id, productId)))
    .limit(1);
  if (duplicate.length === 0) {
    const existingSlug = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (existingSlug.length > 0)
      return {
        success: false,
        message: "A product with this name already exists.",
      };
  }
  await db
    .update(products)
    .set({
      productName: name,
      slug,
      description: values.description?.trim() || null,
      price: values.price.toFixed(2),
      costPrice:
        values.costPrice === undefined ? null : values.costPrice.toFixed(2),
      inventoryCount: values.inventoryCount ?? 0,
      sku: values.sku?.trim() || null,
      categoryId: values.categoryId || null,
      sizes: values.sizes ?? [],
      materials: values.materials?.trim() || null,
      careInstructions: values.careInstructions?.trim() || null,
      isActive: values.isActive,
      featured: values.featured,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
  return { success: true };
}

export async function addProductImages(productId: string, imageUrls: string[]) {
  await requireAdmin();
  const validUrls = imageUrls
    .filter((url) => /^https?:\/\//.test(url))
    .slice(0, 5);
  if (!validUrls.length)
    return { success: false, message: "No valid images supplied." };
  const current = await db
    .select({ displayOrder: productImages.displayOrder })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  if (current.length + validUrls.length > 5)
    return { success: false, message: "A product can have up to five images." };
  await db
    .insert(productImages)
    .values(
      validUrls.map((imageUrl, index) => ({
        productId,
        imageUrl,
        altText: "",
        displayOrder: current.length + index,
      })),
    );
  return { success: true };
}

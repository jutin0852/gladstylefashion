"use server";

import { requireAdmin } from "../../lib/admin-auth";
import { db } from "../../lib/db";
import { orderItems, orders, productImages, productVariants, products } from "../../lib/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { koboToNairaDecimal, parseNairaToKobo } from "@/lib/money";

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
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, productId));
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
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
    price: string;
    costPrice?: string;
    inventoryCount?: number;
    sku?: string;
    categoryId?: string;
    sizes?: string[];
    materials?: string;
    careInstructions?: string;
    isActive: boolean;
    featured: boolean;
    variants?: { id: string; size: string; sku: string; inventoryCount: number; isActive: boolean }[];
  },
) {
  await requireAdmin();
  const name = values.productName.trim();
  let priceKobo: bigint;
  let costPriceKobo: bigint | null = null;
  try {
    priceKobo = parseNairaToKobo(values.price);
    if (values.costPrice) costPriceKobo = parseNairaToKobo(values.costPrice);
  } catch {
    return { success: false, message: "Enter prices with no more than two decimal places." };
  }
  if (name.length < 3 || priceKobo <= BigInt(0) || (values.inventoryCount ?? 0) < 0) {
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
  await db.transaction(async (tx) => {
    const nextVariants = values.variants || [];
    if (nextVariants.length) {
      const sizes = new Set<string>();
      const skus = new Set<string>();
      for (const variant of nextVariants) {
        if (!variant.size.trim() || sizes.has(variant.size.trim().toLowerCase()) || skus.has(variant.sku.trim().toLowerCase()) || !Number.isInteger(variant.inventoryCount) || variant.inventoryCount < 0) throw new Error("Please enter valid, unique size inventory and SKU values.");
        sizes.add(variant.size.trim().toLowerCase());
        skus.add(variant.sku.trim().toLowerCase());
      }
      for (const variant of nextVariants) {
        if (!variant.id.startsWith("new-")) await tx.execute(sql`select id from product_variants where id = ${variant.id} for update`);
        if (!variant.isActive && !variant.id.startsWith("new-")) {
          const activeReservations = await tx.select({ id: orders.id }).from(orders).innerJoin(orderItems, eq(orderItems.orderId, orders.id)).where(and(eq(orderItems.variantId, variant.id), eq(orders.reservationStatus, "active"))).limit(1);
          if (activeReservations.length) throw new Error("This size has an active reservation and cannot be disabled yet.");
        }
        const existing = variant.id.startsWith("new-") ? [] : await tx.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.id, variant.id), eq(productVariants.productId, productId)));
        if (existing.length) {
          await tx.update(productVariants).set({ size: variant.size.trim(), sku: variant.sku.trim(), inventoryCount: variant.inventoryCount, isActive: variant.isActive, updatedAt: new Date() }).where(eq(productVariants.id, variant.id));
        } else {
          await tx.insert(productVariants).values({ productId, size: variant.size.trim(), sku: variant.sku.trim(), inventoryCount: variant.inventoryCount, isActive: variant.isActive });
        }
      }
      const variantInventoryTotal = nextVariants.reduce((total, variant) => total + variant.inventoryCount, 0);
      await tx.update(products).set({
      productName: name,
      slug,
      description: values.description?.trim() || null,
      price: koboToNairaDecimal(priceKobo),
      costPrice: costPriceKobo === null ? null : koboToNairaDecimal(costPriceKobo),
      inventoryCount: variantInventoryTotal,
      sku: values.sku?.trim() || null,
      categoryId: values.categoryId || null,
      sizes: nextVariants.map((variant) => variant.size),
      materials: values.materials?.trim() || null,
      careInstructions: values.careInstructions?.trim() || null,
      isActive: values.isActive,
      featured: values.featured,
      updatedAt: new Date(),
        inventoryMigrationStatus: "migrated",
        inventoryReconciliationRequired: false,
      }).where(eq(products.id, productId));
    } else {
      await tx.update(products).set({
        productName: name,
        slug,
        description: values.description?.trim() || null,
        price: koboToNairaDecimal(priceKobo),
        costPrice: costPriceKobo === null ? null : koboToNairaDecimal(costPriceKobo),
        inventoryCount: values.inventoryCount ?? 0,
        sku: values.sku?.trim() || null,
        categoryId: values.categoryId || null,
        sizes: values.sizes ?? [],
        materials: values.materials?.trim() || null,
        careInstructions: values.careInstructions?.trim() || null,
        isActive: values.isActive,
        featured: values.featured,
        updatedAt: new Date(),
      }).where(eq(products.id, productId));
    }
  });
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/product/${slug}`);
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

"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../lib/admin-auth";
import { db } from "../../lib/db";
import { transactionDb } from "../../lib/transaction-db";
import { categories, products } from "../../lib/schema";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createCategory(values: {
  name: string;
  description?: string;
}) {
  await requireAdmin();
  const name = values.name.trim();
  const slug = slugify(name);
  if (name.length < 2 || !slug) {
    return { success: false, message: "Enter a category name of at least two characters." };
  }
  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
  if (existing.length) return { success: false, message: "A category with this name already exists." };
  await db.insert(categories).values({ name, slug, description: values.description?.trim() || null });
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
    await transactionDb.transaction(async (tx) => {
    await tx.update(products).set({ categoryId: null, updatedAt: new Date() }).where(eq(products.categoryId, id));
    await tx.delete(categories).where(eq(categories.id, id));
  });
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function getCategoryOptions() {
  await requireAdmin();
  return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name));
}

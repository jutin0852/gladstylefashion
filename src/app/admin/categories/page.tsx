import { asc, sql } from "drizzle-orm";
import { CategoryManagement } from "../../../components/admin/category-management";
import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { categories, products } from "../../../lib/schema";

export default async function CategoriesPage() {
  await requireAdmin();
  const categoryList = await db.select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description, productCount: sql<number>`count(${products.id})` }).from(categories).leftJoin(products, sql`${products.categoryId} = ${categories.id}`).groupBy(categories.id).orderBy(asc(categories.name));
  return <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6"><div><h1 className="text-xl font-semibold">Categories</h1><p className="text-sm text-muted-foreground">Organise the collection and assign products to each category.</p></div><CategoryManagement categories={categoryList.map((category) => ({ ...category, productCount: Number(category.productCount) }))} /></section>;
}

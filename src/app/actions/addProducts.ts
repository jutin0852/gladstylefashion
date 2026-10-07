/* eslint-disable @typescript-eslint/no-explicit-any */
// app/actions/products.ts
"use server";

import { ProductSchema } from "@/types/admin/admin";
import { NewProduct, products } from "../../lib/schema";
import { createProduct } from "../../lib/admin/queries/product";
import { db } from "../../lib/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../lib/admin-auth";
import { revalidatePath } from "next/cache";
import { koboToNairaDecimal, parseNairaToKobo } from "@/lib/money";

// import { revalidatePath } from "next/cache";

export async function checkSlugExists(productName: string) {
  const slug = productName.toLowerCase().replace(/\s+/g, "-");

  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  return existing.length > 0;
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const images = formData.getAll("images");

  const validatedProductFields = ProductSchema.safeParse({
    productName: formData.get("productName"),
    description: formData.get("description"),
    price: String(formData.get("price") || ""),
    costPrice: formData.get("costPrice")
      ? String(formData.get("costPrice"))
      : undefined,
    inventoryCount: Number(formData.get("inventoryCount")),
    images,
    sku: formData.get("sku") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    sizes: String(formData.get("sizes") || "")
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean),
    isActive: formData.get("isActive") !== "false",
    featured: formData.get("featured") === "true",
    materials: formData.get("materials") || undefined,
    careInstructions: formData.get("careInstructions") || undefined,
  });

  const variantInventory: Record<string, number> = {};
  try {
    const raw = JSON.parse(String(formData.get("variantInventory") || "{}")) as Record<string, unknown>;
    for (const [size, value] of Object.entries(raw)) {
      const count = Number(value);
      if (!Number.isInteger(count) || count < 0) throw new Error("invalid variant inventory");
      variantInventory[size] = count;
    }
  } catch {
    return { message: "Enter a valid non-negative inventory count for every size." };
  }

  if (!validatedProductFields.success) {
    return {
      errors: validatedProductFields.error.flatten().fieldErrors,
      message: "Validation failed",
    };
  }
  if ((validatedProductFields.data.sizes?.length || 0) > 0 && validatedProductFields.data.sizes?.some((size) => variantInventory[size] === undefined)) {
    return { message: "Enter an inventory count for every listed size before publishing." };
  }
  const priceKobo = parseNairaToKobo(validatedProductFields.data.price);
  const costPriceKobo = validatedProductFields.data.costPrice
    ? parseNairaToKobo(validatedProductFields.data.costPrice)
    : null;
  if (priceKobo <= BigInt(0)) {
    return { message: "Price must be greater than zero." };
  }
  const dbData = {
    productName: validatedProductFields.data.productName, // Map productName to name
    slug: validatedProductFields.data.productName
      .toLowerCase()
      .replace(/\s+/g, "-"), // Generate slug
    description: validatedProductFields.data.description ?? null,
    price: koboToNairaDecimal(priceKobo),
    costPrice: costPriceKobo === null ? null : koboToNairaDecimal(costPriceKobo),
    inventoryCount: validatedProductFields.data.inventoryCount ?? null,
    categoryId: validatedProductFields.data.categoryId ?? null,
    sku: validatedProductFields.data.sku ?? null,
    isActive: validatedProductFields.data.isActive,
    featured: validatedProductFields.data.featured,
    sizes: validatedProductFields.data.sizes ?? [],
    inventoryMigrationStatus: "migrated",
    materials: validatedProductFields.data.materials ?? null,
    careInstructions: validatedProductFields.data.careInstructions ?? null,
  };

  try {
    const newProduct: NewProduct = dbData;
    const product = await createProduct(
      newProduct,
      validatedProductFields.data.images!,
      variantInventory,
    );

    revalidatePath("/");
    revalidatePath("/sitemap.xml");

    return {
      success: true,
      message: "Product created successfully",
      productId: product.id,
    };
  } catch (error) {
    if (error instanceof Error) {
      const cause = (error as any).cause;
      if (cause && cause.code === "23505") {
        console.log("Caught duplicate slug error");
        return {
          success: false,
          message:
            "A product with this name already exists. Please use a different name.",
        };
      }
    }
    return {
      success: false,
      message: "Failed to create product. Please try again.",
    };
  }
}

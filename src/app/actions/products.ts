// app/actions/products.ts
"use server";

import { ProductSchema } from "@/types/admin/admin";
import { products } from "../../lib/schema";
import { db } from "../../lib/db";
// import { revalidatePath } from "next/cache";

type NewProduct = typeof products.$inferInsert;

export async function createProduct(formData: FormData) {
  console.log(formData, "yess");

  const images = formData.getAll("images");

  const validatedProductFields = ProductSchema.safeParse({
    productName: formData.get("productName"),
    description: formData.get("description"),
    price: Number(formData.get("price")),
    costPrice: formData.get("costPrice")
      ? Number(formData.get("costPrice"))
      : undefined,
    inventoryCount: Number(formData.get("inventoryCount")),
    images,
  });

  if (!validatedProductFields.success) {
    return {
      errors: validatedProductFields.error.flatten().fieldErrors,
      message: "Validation failed",
    };
  }
  console.log(validatedProductFields.data, "validated ");

  const dbData = {
    productName: validatedProductFields.data.productName, // Map productName to name
    slug: validatedProductFields.data.productName
      .toLowerCase()
      .replace(/\s+/g, "-"), // Generate slug
    description: validatedProductFields.data.description ?? null,
    price: validatedProductFields.data.price.toString(), // Convert number to string
    costPrice: validatedProductFields.data.costPrice?.toString() ?? null,
    inventoryCount: validatedProductFields.data.inventoryCount ?? null,
    categoryId: validatedProductFields.data.categoryId ?? null,
    sku: validatedProductFields.data.sku ?? null,
    images: validatedProductFields.data.images ?? [],
    isActive: validatedProductFields.data.isActive,
    featured: validatedProductFields.data.featured,
    sizes: validatedProductFields.data.sizes ?? [],
    materials: validatedProductFields.data.materials ?? null,
    careInstructions: validatedProductFields.data.careInstructions ?? null,
  };

  try {
    const insertUser = async (product: NewProduct) => {
      return db.insert(products).values(product).returning();
    };

    const newUser: NewProduct = dbData;
    const [product] = await insertUser(newUser);

    //     revalidatePath("/admin/products");

    return {
      success: true,
      message: "Product created successfully",
      productId: product.id,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      message: "Failed to create product. Please try again.",
    };
  }
}

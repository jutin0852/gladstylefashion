import * as z from "zod";

export const ProductSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  costPrice: z.number().min(0).optional(),
  categoryId: z.string().optional(),
  inventoryCount: z.number().min(0).optional(),
  sku: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  isActive: z.boolean().default(true).optional(),
  featured: z.boolean().default(false).optional(),
  sizes: z.array(z.string()).optional(), // ["XS", "S", "M", "L", "XL"]
  materials: z.string().optional(),
  careInstructions: z.string().optional(),
});

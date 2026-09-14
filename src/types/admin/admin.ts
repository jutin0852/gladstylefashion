import * as z from "zod";

export const ProductSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(3, "Product name must be at least 3 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than zero"),
  costPrice: z.number().min(0).optional(),
  categoryId: z.string().optional(),
  inventoryCount: z.number().int().min(0).optional(),
  sku: z.string().optional(),
  images: z
    .array(z.string().url())
    .min(1, "At least one image is required")
    .optional(),
  isActive: z.boolean().default(true).optional(),
  featured: z.boolean().default(false).optional(),
  sizes: z.array(z.string()).optional(), // ["XS", "S", "M", "L", "XL"]
  materials: z.string().optional(),
  careInstructions: z.string().optional(),
});

const ImageFileSchema = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), {
    message: "Only image files are allowed",
  })
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    message: "Image must be under 5MB",
  });

export const ImageFilesSchema = z
  .array(ImageFileSchema)
  .min(1, "At least one image is required")
  .max(5, "You can upload up to 5 images");

// export const ProductSchema = z.object({
//   productName: z
//     .string()
//     .min(3, "Product name must be at least 3 characters.")
//     .max(100, "Product name must be at most 100 characters."),
//   description: z
//     .string()
//     .min(20, "Description must be at least 20 characters.")
//     .max(500, "Description must be at most 500 characters.")
//     .optional(),
//   price: z.number().min(0, "Price must be a positive number"),

//   costPrice: z
//     .number()
//     .nonnegative("Cost price must be a non-negative number")
//     .or(z.string().transform(Number))
//     .optional(),
//   inventoryCount: z
//     .number()
//     .int()
//     .nonnegative("Inventory count must be a non-negative integer")
//     .or(z.string().transform(Number))
//     .optional(),
//   images: z
//     .array(z.instanceof(File))
//     .min(1, "At least one image is required")
//     .max(5, "Maximum 5 images allowed")
//     .refine(
//       (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
//       "Each image must be less than 5MB",
//     )
//     .refine(
//       (files) =>
//         files.every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
//       "Only .jpg, .png and .webp formats are supported",
//     )
//     .optional(),
// });

export type Product = z.infer<typeof ProductSchema>;

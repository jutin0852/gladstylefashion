// // app/actions/products.ts
// "use server";


// import { ProductSchema } from "@/types/admin/admin";
// import { revalidatePath } from "next/cache";
// import cloudinary from "@/lib/cloudinary";

// async function uploadToCloudinary(file: File): Promise<string> {
//   const arrayBuffer = await file.arrayBuffer();
//   const buffer = Buffer.from(arrayBuffer);

//   return new Promise((resolve, reject) => {
//     cloudinary.uploader
//       .upload_stream(
//         {
//           folder: "products",
//           resource_type: "image",
//         },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result!.secure_url);
//         },
//       )
//       .end(buffer);
//   });
// }

// export async function createProduct(formData: FormData) {
//   // Get all images from FormData
//   const images = formData.getAll("images") as File[];

//   const validatedFields = ProductSchema.safeParse({
//     productName: formData.get("productName"),
//     description: formData.get("description"),
//     price: Number(formData.get("price")),
//     costPrice: formData.get("costPrice")
//       ? Number(formData.get("costPrice"))
//       : undefined,
//     inventoryCount: Number(formData.get("inventoryCount")),
//     images,
//   });

//   if (!validatedFields.success) {
//     return {
//       errors: validatedFields.error.flatten().fieldErrors,
//       message: "Validation failed",
//     };
//   }

//   const {
//     productName,
//     description,
//     price,
//     costPrice,
//     inventoryCount,
//     images: validatedImages,
//   } = validatedFields.data;

//   try {
//     // Upload all images to Cloudinary in parallel
//     const uploadPromises = validatedImages.map((image) =>
//       uploadToCloudinary(image),
//     );
//     const imageUrls = await Promise.all(uploadPromises);

//     // Insert product into database
//     const [product] = await db
//       .insert(products)
//       .values({
//         name: productName,
//         description,
//         price: price.toString(),
//         costPrice: costPrice ? costPrice.toString() : null,
//         inventoryCount,
//         imageUrl: imageUrls[0], // Primary image
//       })
//       .returning();

//     // Insert all product images
//     if (imageUrls.length > 0) {
//       await db.insert(productImages).values(
//         imageUrls.map((url, index) => ({
//           productId: product.id,
//           imageUrl: url,
//           isPrimary: index === 0,
//         })),
//       );
//     }

//     revalidatePath("/admin/products");

//     return {
//       success: true,
//       message: "Product created successfully",
//       productId: product.id,
//     };
//   } catch (error) {
//     console.error("Error creating product:", error);
//     return {
//       success: false,
//       message: "Failed to create product. Please try again.",
//     };
//   }
// }

import { db } from "../../db";
import {
  NewProduct,
  NewProductImage,
  productImages,
  products,
} from "../../schema";
import { and, asc, desc, eq, gt } from "drizzle-orm";

export const getAllProducts = async () => {
  return db.query.products.findMany({
    where: and(eq(products.isActive, true), gt(products.price, "0")),
    with: {
      images: {
        orderBy: (image) => [asc(image.displayOrder)],
      },
      category: true,
    },
    orderBy: [desc(products.createdAt)],
  });
};

export const getAllAdminProducts = async () => {
  return db.query.products.findMany({
    with: {
      images: {
        orderBy: (image) => [asc(image.displayOrder)],
      },
      category: true,
    },
    orderBy: [desc(products.createdAt)],
  });
};

export const getAdminProductById = async (id: string) => {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: { orderBy: (image) => [asc(image.displayOrder)] },
      category: true,
    },
  });
};

export const getProductBySlug = async (slug: string) => {
  return db.query.products.findFirst({
    where: and(
      eq(products.slug, slug),
      eq(products.isActive, true),
      gt(products.price, "0"),
    ),
    with: {
      images: {
        orderBy: (image) => [asc(image.displayOrder)],
      },
      category: true,
    },
  });
};

export async function createProduct(product: NewProduct, images: string[]) {
  try {
    // Insert the product first
    const [newProduct] = await db.insert(products).values(product).returning();

    const productImagesArray: NewProductImage[] = images.map((img, i) => {
      return {
        productId: newProduct.id,
        imageUrl: img,
        altText: "",
        displayOrder: i,
      };
    });

    // Insert images for the product
    await db.insert(productImages).values(productImagesArray);

    return newProduct;
  } catch (error) {
    console.log("error in error 1");
    throw error; // unknown error → crash
  }
}

// Example 2: Get a product with all its images
// export async function getProductWithImages(db: any, productId: number) {
//   const result = await db.query.products.findFirst({
//     where: eq(products.id, productId),
//     with: {
//       images: {
//         orderBy: (images: any, { asc }: any) => [asc(images.displayOrder)],
//       },
//     },
//   });

//   return result;
// }

// // Example 3: Get all products with their images
// export async function getAllProductsWithImages(db: any) {
//   const result = await db.query.products.findMany({
//     with: {
//       images: {
//         orderBy: (images: any, { asc }: any) => [asc(images.displayOrder)],
//       },
//     },
//   });

//   return result;
// }

// // Example 4: Get product by name with images
// export async function getProductByNameWithImages(db: any, productName: string) {
//   const result = await db.query.products.findFirst({
//     where: eq(products.name, productName),
//     with: {
//       images: {
//         orderBy: (images: any, { asc }: any) => [asc(images.displayOrder)],
//       },
//     },
//   });

//   return result;
// }

// // Example 5: Update product images
// export async function updateProductImage(
//   db: any,
//   imageId: number,
//   newImageUrl: string
// ) {
//   await db
//     .update(productImages)
//     .set({ imageUrl: newImageUrl })
//     .where(eq(productImages.id, imageId));
// }

// // Example 6: Delete a product (will cascade delete all images)
// export async function deleteProduct(db: any, productId: number) {
//   await db.delete(products).where(eq(products.id, productId));
// }

// Example usage in a route or component:
/*
const product = await getProductWithImages(db, 1);
console.log(product);
// Output:
// {
//   id: 1,
//   name: 'Wireless Headphones',
//   description: '...',
//   price: 19999,
//   createdAt: ...,
//   updatedAt: ...,
//   images: [
//     { id: 1, productId: 1, imageUrl: '...', altText: '...', displayOrder: 0 },
//     { id: 2, productId: 1, imageUrl: '...', altText: '...', displayOrder: 1 },
//     { id: 3, productId: 1, imageUrl: '...', altText: '...', displayOrder: 2 },
//   ]
// }
*/

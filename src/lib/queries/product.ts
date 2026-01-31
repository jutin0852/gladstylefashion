import { db } from "../db";
import { products } from "../schema";

export const getAllProducts = async () => {
  const allProducts = await db.select().from(products);
  console.log("All Products:", allProducts);

  return allProducts;
};

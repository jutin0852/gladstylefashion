import React from "react";
import { getAllProducts } from "../../../lib/queries/product";

export default async function page() {
  const allProducts = await getAllProducts();
  console.log(allProducts);
  if (!allProducts || allProducts.length === 0) {
    return <div>No products found</div>;
  }
  return <div>{allProducts.length} products</div>;
}

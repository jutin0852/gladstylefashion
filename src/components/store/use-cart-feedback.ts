"use client";

import { useEffect, useRef, useState } from "react";
import { useCart, type ProductCustomizations, type StoreProduct } from "./cart-context";
import type { AddToCartResult } from "./cart-operations";

export function useCartFeedback() {
  const { addToCart } = useCart();
  const [feedback, setFeedback] = useState<(AddToCartResult & { productId: string }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  function addWithFeedback(product: StoreProduct, size = "", quantity = 1, customizations?: ProductCustomizations) {
    if (timer.current !== null) clearTimeout(timer.current);
    const result = addToCart(product, size, quantity, customizations);
    setFeedback({ ...result, productId: product.id });
    // Keep stock explanations visible so the customer has time to act on them.
    if (result.success) timer.current = setTimeout(() => setFeedback(null), 2000);
  }

  return { feedback, addWithFeedback };
}

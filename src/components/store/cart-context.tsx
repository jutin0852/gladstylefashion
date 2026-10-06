"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { addCartItems, type AddToCartResult } from "./cart-operations";
import { multiplyNairaDecimal, sumNairaDecimals } from "@/lib/money";

export type StoreProduct = {
  id: string;
  productName: string;
  slug: string;
  description: string | null;
  price: string;
  isActive: boolean | null;
  featured: boolean | null;
  inventoryCount: number | null;
  inventoryMigrationStatus: string;
  inventoryReconciliationRequired: boolean;
  variants: { id: string; size: string; sku: string; inventoryCount: number; isActive: boolean }[];
  images: { id: number; imageUrl: string; altText: string | null }[];
  category: { name: string; slug?: string } | null;
  sizes?: string[] | null;
  materials?: string | null;
  careInstructions?: string | null;
};

export type ProductCustomizations = {
  color?: string;
  desiredLength?: string;
  customerHeight?: string;
  notes?: string;
};
export type CartItem = StoreProduct & { quantity: number; variantId?: string; size?: string; customizations?: ProductCustomizations };

type CartContextValue = {
  cart: CartItem[];
  cartCount: number;
  cartTotal: string;
  addToCart: (product: StoreProduct, size?: string, quantity?: number, customizations?: ProductCustomizations) => AddToCartResult;
  updateQuantity: (id: string, change: number, size?: string, customizations?: ProductCustomizations) => void;
  removeItem: (id: string, size?: string, customizations?: ProductCustomizations) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "gladstyle-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartRef = useRef<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Keep event handlers in sync even when several updates happen before a render.
  function saveCart(nextCart: CartItem[]) {
    cartRef.current = nextCart;
    setCart(nextCart);
  }

  useEffect(() => {
    const savedCart = window.localStorage.getItem(storageKey);
    if (savedCart) {
      try {
        const savedItems = JSON.parse(savedCart) as CartItem[];
        saveCart(
          savedItems
            .filter((item) => item.quantity > 0)
            .map((item) => ({ ...item, price: String(item.price), size: item.size || "", variantId: item.variantId || undefined })),
        );
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, loaded]);

  function addToCart(product: StoreProduct, size = "", quantity = 1, customizations?: ProductCustomizations) {
    const next = addCartItems(cartRef.current, product, size, quantity, customizations);
    if (next.result.success) saveCart(next.cart);
    return next.result;
  }

  function updateQuantity(id: string, change: number, size = "", customizations?: ProductCustomizations) {
    const current = cartRef.current;
    const existing = current.find((item) => item.id === id && (item.inventoryMigrationStatus !== "migrated" ? !item.variantId : item.variantId === item.variants.find((variant) => variant.size === (size || "ONE_SIZE"))?.id) && JSON.stringify(item.customizations || {}) === JSON.stringify(customizations || {}));
    if (!existing) return;
    if (change > 0) {
      addToCart(existing, size, change, customizations);
      return;
    }
    saveCart(
      current
        .map((item) =>
          item.id === id && item.variantId === existing.variantId && JSON.stringify(item.customizations || {}) === JSON.stringify(customizations || {})
            ? {
                ...item,
                quantity: item.quantity + change,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(id: string, size = "", customizations?: ProductCustomizations) {
    saveCart(
      cartRef.current.filter((item) => !(item.id === id && (item.inventoryMigrationStatus !== "migrated" ? !item.variantId : item.variantId === item.variants.find((variant) => variant.size === (size || "ONE_SIZE"))?.id) && JSON.stringify(item.customizations || {}) === JSON.stringify(customizations || {}))),
    );
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart.reduce((total, item) => total + item.quantity, 0),
        cartTotal: sumNairaDecimals(cart.map((item) => multiplyNairaDecimal(item.price, item.quantity))),
        addToCart,
        updateQuantity,
        removeItem,
        clearCart: () => {
          window.localStorage.removeItem(storageKey);
          saveCart([]);
        },
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

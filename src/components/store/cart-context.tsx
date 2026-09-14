"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type StoreProduct = {
  id: string;
  productName: string;
  slug: string;
  description: string | null;
  price: string;
  isActive: boolean | null;
  featured: boolean | null;
  inventoryCount: number | null;
  images: { id: number; imageUrl: string; altText: string | null }[];
  category: { name: string } | null;
  sizes?: string[] | null;
  materials?: string | null;
  careInstructions?: string | null;
};

export type CartItem = StoreProduct & { quantity: number; size?: string };

type CartContextValue = {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: StoreProduct, size?: string) => void;
  updateQuantity: (id: string, change: number, size?: string) => void;
  removeItem: (id: string, size?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "gladstyle-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = window.localStorage.getItem(storageKey);
    if (savedCart) {
      try {
        const savedItems = JSON.parse(savedCart) as CartItem[];
        setCart(
          savedItems
            .filter((item) => item.quantity > 0)
            .map((item) => ({ ...item, size: item.size || "" })),
        );
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart]);

  function addToCart(product: StoreProduct, size = "") {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id && item.size === size,
      );
      const maxQuantity = product.inventoryCount ?? 0;
      if (existing) {
        return current.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: Math.min(maxQuantity, item.quantity + 1) }
            : item,
        );
      }
      return maxQuantity > 0
        ? [...current, { ...product, quantity: 1, size }]
        : current;
    });
  }

  function updateQuantity(id: string, change: number, size = "") {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id && item.size === size
            ? {
                ...item,
                quantity: Math.min(
                  item.inventoryCount ?? 0,
                  item.quantity + change,
                ),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(id: string, size = "") {
    setCart((current) =>
      current.filter((item) => !(item.id === id && item.size === size)),
    );
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart.reduce((total, item) => total + item.quantity, 0),
        cartTotal: cart.reduce(
          (total, item) => total + Number(item.price) * item.quantity,
          0,
        ),
        addToCart,
        updateQuantity,
        removeItem,
        clearCart: () => setCart([]),
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

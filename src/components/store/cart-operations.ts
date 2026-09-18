import type { CartItem, ProductCustomizations, StoreProduct } from "./cart-context";

export type AddToCartResult = { success: boolean; message: string };

export function addCartItems(
  cart: CartItem[],
  product: StoreProduct,
  size = "",
  quantity = 1,
  customizations?: ProductCustomizations,
): { cart: CartItem[]; result: AddToCartResult } {
  const reject = (message: string) => ({
    cart,
    result: { success: false, message },
  });
  if (!Number.isInteger(quantity) || quantity < 1) {
    return reject("Choose a positive whole-number quantity.");
  }
  const inBag = cart.reduce(
    (total, item) => total + (item.id === product.id ? item.quantity : 0),
    0,
  );
  const stock = product.inventoryCount ?? 0;
  if (inBag > stock) {
    return reject(`Stock has changed. Only ${stock} available; please adjust your bag.`);
  }
  if (stock <= 0) return reject("This product is sold out.");
  const remaining = stock - inBag;
  if (remaining === 0) return reject("Available quantity already in your bag.");
  if (quantity > remaining) {
    return reject(`You can add only ${remaining} more. Please adjust your quantity.`);
  }
  const sameCustomizations = (item: CartItem) => JSON.stringify(item.customizations || {}) === JSON.stringify(customizations || {});
  const existing = cart.some((item) => item.id === product.id && (item.size || "") === size && sameCustomizations(item));
  const nextCart = existing
    ? cart.map((item) =>
        item.id === product.id && (item.size || "") === size && sameCustomizations(item)
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      )
    : [...cart, { ...product, quantity, size, customizations }];
  return {
    cart: nextCart,
    result: {
      success: true,
      message: quantity === 1 ? "Added to bag" : `${quantity} items added to bag`,
    },
  };
}

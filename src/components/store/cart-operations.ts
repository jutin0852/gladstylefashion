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
  const variant = product.variants.find((item) => item.size === (size || "ONE_SIZE"));
  const cartVariantId = variant?.id;
  const inBag = cart.reduce(
    (total, item) => total + (item.id === product.id && item.variantId === cartVariantId ? item.quantity : 0),
    0,
  );
  const stock = product.inventoryMigrationStatus === "migrated"
    ? variant?.inventoryCount ?? 0
    : product.inventoryCount ?? 0;
  if (product.inventoryMigrationStatus === "migrated" && !variant) return reject("Choose an available size.");
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
  const existing = cart.some((item) => item.id === product.id && item.variantId === cartVariantId && sameCustomizations(item));
  const nextCart = existing
    ? cart.map((item) =>
        item.id === product.id && item.variantId === cartVariantId && sameCustomizations(item)
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      )
    : [...cart, { ...product, quantity, variantId: cartVariantId, size, customizations }];
  return {
    cart: nextCart,
    result: {
      success: true,
      message: quantity === 1 ? "Added to bag" : `${quantity} items added to bag`,
    },
  };
}

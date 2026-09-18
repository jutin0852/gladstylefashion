import assert from "node:assert/strict";
import { test } from "node:test";
import { addCartItems } from "./cart-operations";
import type { CartItem, StoreProduct } from "./cart-context";

const product: StoreProduct = {
  id: "shirt", productName: "Shirt", slug: "shirt", description: null,
  price: "20", isActive: true, featured: false, inventoryCount: 3,
  images: [], category: null,
};
const row = (quantity: number, size = "M"): CartItem => ({ ...product, quantity, size });

test("adding below stock increases the selected size without mutating the old cart", () => {
  const cart = [row(1)];
  const next = addCartItems(cart, product, "M");
  assert.equal(next.result.success, true);
  assert.equal(next.cart[0].quantity, 2);
  assert.equal(cart[0].quantity, 1);
});

test("adding at the limit leaves the cart unchanged", () => {
  const cart = [row(3)];
  const next = addCartItems(cart, product, "M");
  assert.equal(next.cart, cart);
  assert.equal(next.result.success, false);
});

test("adding after stock falls never reduces the saved quantity", () => {
  const cart = [row(6)];
  const next = addCartItems(cart, product, "M");
  assert.equal(next.cart, cart);
  assert.match(next.result.message, /Stock has changed/);
});

test("inventory is shared across sizes", () => {
  const next = addCartItems([row(2)], product, "L", 2);
  assert.equal(next.result.success, false);
  assert.equal(next.cart.length, 1);
});

test("multi-unit additions either succeed completely or leave the cart unchanged", () => {
  const first = addCartItems([], product, "M", 2);
  assert.equal(first.cart[0].quantity, 2);
  const next = addCartItems(first.cart, product, "M", 2);
  assert.equal(next.cart, first.cart);
  assert.equal(next.result.success, false);
});

test("sold-out and invalid quantity requests do not create a cart row", () => {
  for (const quantity of [0, -1, 1.5, NaN]) {
    assert.equal(addCartItems([], product, "", quantity).result.success, false);
  }
  assert.equal(addCartItems([], { ...product, inventoryCount: 0 }).cart.length, 0);
  assert.equal(addCartItems([], { ...product, inventoryCount: null }).cart.length, 0);
});

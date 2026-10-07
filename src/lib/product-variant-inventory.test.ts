import assert from "node:assert/strict";
import { test } from "node:test";

type Variant = { id: string; size: string; inventory: number; active: boolean };

function reserve(variants: Variant[], variantId: string, quantity: number) {
  const variant = variants.find((item) => item.id === variantId);
  if (!variant || !variant.active || variant.inventory < quantity) return false;
  variant.inventory -= quantity;
  return true;
}

test("the final Large does not affect Small or Medium", () => {
  const variants = [{ id: "s", size: "Small", inventory: 2, active: true }, { id: "m", size: "Medium", inventory: 5, active: true }, { id: "l", size: "Large", inventory: 1, active: true }];
  assert.equal(reserve(variants, "l", 1), true);
  assert.deepEqual(variants.map((item) => item.inventory), [2, 5, 0]);
});

test("a disabled or sold-out size is unavailable while other sizes remain purchasable", () => {
  const variants = [{ id: "s", size: "Small", inventory: 2, active: true }, { id: "m", size: "Medium", inventory: 5, active: true }, { id: "l", size: "Large", inventory: 0, active: true }];
  assert.equal(reserve(variants, "l", 1), false);
  assert.equal(reserve(variants, "s", 1), true);
  assert.equal(variants[0].inventory, 1);
});

test("a failed multi-variant reservation leaves every variant unchanged", () => {
  const variants = [{ id: "s", size: "Small", inventory: 1, active: true }, { id: "m", size: "Medium", inventory: 0, active: true }];
  const snapshot = variants.map((item) => item.inventory);
  const first = reserve(variants, "s", 1);
  const second = reserve(variants, "m", 1);
  assert.equal(first, true);
  assert.equal(second, false);
  variants[0].inventory = snapshot[0];
  assert.deepEqual(variants.map((item) => item.inventory), snapshot);
});

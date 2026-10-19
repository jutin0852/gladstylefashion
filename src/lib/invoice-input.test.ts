import assert from "node:assert/strict";
import { test } from "node:test";
import { paymentInputSchema } from "./invoice-input";

const base = {
  invoiceId: "inv_1",
  amount: "100000",
  paidAt: "2026-10-20",
  receivedFrom: "Customer",
};

test("non-cash payments must say which bank received the money", () => {
  assert.equal(paymentInputSchema.safeParse({ ...base, method: "transfer", bank: "" }).success, false);
  assert.equal(paymentInputSchema.safeParse({ ...base, method: "card" }).success, false);
  assert.equal(paymentInputSchema.safeParse({ ...base, method: "transfer", bank: "Access Bank" }).success, true);
  assert.equal(paymentInputSchema.safeParse({ ...base, method: "card", bank: "GT Bank" }).success, true);
});

test("cash payments need no bank, and only the two shop banks are accepted", () => {
  assert.equal(paymentInputSchema.safeParse({ ...base, method: "cash", bank: "" }).success, true);
  assert.equal(paymentInputSchema.safeParse({ ...base, method: "transfer", bank: "Some Other Bank" }).success, false);
});

test("only transfer, cash, card and cheque are valid payment methods", () => {
  assert.equal(paymentInputSchema.safeParse({ ...base, method: "pos", bank: "Access Bank" }).success, false);
});

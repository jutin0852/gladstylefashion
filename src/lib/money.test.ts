import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatKobo,
  koboToNairaDecimal,
  multiplyNairaDecimal,
  parseNairaToKobo,
  parsePaystackAmount,
  sumNairaDecimals,
  toPaystackAmount,
} from "./money";
import { matchesPaystackPayment } from "./paystack";

test("parses supported Naira decimals into exact kobo", () => {
  const cases = [
    ["0", "0"],
    ["0.10", "10"],
    ["0.20", "20"],
    ["19.99", "1999"],
    ["2500", "250000"],
    ["2500.7", "250070"],
    ["2500.75", "250075"],
  ] as const;

  for (const [input, expected] of cases) {
    assert.equal(parseNairaToKobo(input), BigInt(expected));
  }
});

test("rejects malformed, over-precision, and negative monetary input", () => {
  for (const input of ["", "abc", "12.3.4", "1.999", "-100", "+1", "1e3"]) {
    assert.throws(() => parseNairaToKobo(input));
  }
});

test("round-trips kobo without changing its monetary meaning", () => {
  for (const input of ["0.00", "0.10", "19.99", "2500.70", "2500.75"]) {
    assert.equal(koboToNairaDecimal(parseNairaToKobo(input)), input);
  }
});

test("multiplies and sums money without JavaScript floating-point arithmetic", () => {
  assert.equal(multiplyNairaDecimal("19.99", 3), "59.97");
  assert.equal(sumNairaDecimals(["0.10", "0.20"]), "0.30");
  assert.equal(sumNairaDecimals(["19.99", "19.99", "19.99"]), "59.97");
  assert.equal(sumNairaDecimals([multiplyNairaDecimal("19.99", 3), multiplyNairaDecimal("0.20", 2)]), "60.37");
});

test("normalizes admin price input before storage", () => {
  const normalized = koboToNairaDecimal(parseNairaToKobo("2500.7"));
  assert.equal(normalized, "2500.70");
  assert.equal(koboToNairaDecimal(parseNairaToKobo("19.99") * BigInt(2)), "39.98");
});

test("formats exact kobo values for display", () => {
  assert.equal(formatKobo(BigInt(250075)), "₦2,500.75");
  assert.equal(formatKobo(BigInt(250000)), "₦2,500");
});

test("creates and validates the exact Paystack integer amount", () => {
  assert.equal(toPaystackAmount(BigInt(250075)), 250075);
  assert.equal(parsePaystackAmount(250075), BigInt(250075));
  assert.throws(() => toPaystackAmount(BigInt(-1)));
  assert.throws(() => toPaystackAmount(BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1)));
  assert.throws(() => parsePaystackAmount(250075.5));
});

test("rejects Paystack amount, currency, and reference mismatches", () => {
  const payment = { status: "success", reference: "GS-123", amount: 250075, currency: "NGN" };
  assert.equal(matchesPaystackPayment(payment, "GS-123", BigInt(250075)), true);
  assert.equal(matchesPaystackPayment({ ...payment, amount: 250076 }, "GS-123", BigInt(250075)), false);
  assert.equal(matchesPaystackPayment({ ...payment, currency: "USD" }, "GS-123", BigInt(250075)), false);
  assert.equal(matchesPaystackPayment(payment, "GS-456", BigInt(250075)), false);
});

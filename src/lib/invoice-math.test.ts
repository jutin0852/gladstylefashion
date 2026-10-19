import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeAmount,
  sumAmounts,
  formatDocumentNumber,
  isWholeNaira,
  nairaToWords,
  summarizeInvoice,
} from "./invoice-math";

test("formats document numbers like the printed books", () => {
  assert.equal(formatDocumentNumber(3777), "0003777");
  assert.equal(formatDocumentNumber(1148), "0001148");
});

test("writes amounts in words", () => {
  assert.equal(nairaToWords("175000"), "One hundred and seventy-five thousand naira only");
  assert.equal(nairaToWords("30000"), "Thirty thousand naira only");
  assert.equal(nairaToWords("15000"), "Fifteen thousand naira only");
  assert.equal(nairaToWords("1000000"), "One million naira only");
  assert.equal(nairaToWords("1000005"), "One million and five naira only");
  assert.equal(nairaToWords("2500000"), "Two million five hundred thousand naira only");
  assert.equal(nairaToWords("0"), "Zero naira only");
});

test("normalises item prices and totals a garment's items", () => {
  assert.equal(normalizeAmount("130000"), "130000.00");
  assert.throws(() => normalizeAmount(""));
  assert.equal(sumAmounts(["30000", "15000.00", "5000"]), "50000.00");
  assert.equal(sumAmounts([]), "0.00");
});

test("summarizes totals, balance and payment status from lines and payments", () => {
  const lines = ["130000", "30000", "15000"];
  assert.deepEqual(summarizeInvoice(lines, []), {
    total: "175000.00", paid: "0.00", balance: "175000.00", paymentStatus: "unpaid",
  });
  assert.deepEqual(summarizeInvoice(lines, ["100000"]), {
    total: "175000.00", paid: "100000.00", balance: "75000.00", paymentStatus: "part_paid",
  });
  assert.equal(summarizeInvoice(lines, ["100000", "75000"]).paymentStatus, "paid");
  // Invoice edited downwards after payment: balance never goes negative.
  assert.equal(summarizeInvoice(["50000"], ["60000"]).balance, "0.00");
});

test("accepts whole naira only", () => {
  assert.equal(isWholeNaira("30000"), true);
  assert.equal(isWholeNaira("30000.00"), true);
  assert.equal(isWholeNaira("30000.50"), false);
  assert.equal(isWholeNaira("-5"), false);
});

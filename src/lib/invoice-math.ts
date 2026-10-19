import { koboToNairaDecimal, parseNairaToKobo, type MoneyKobo } from "./money";

const ZERO = BigInt(0);
const HUNDRED = BigInt(100);

export const INVOICE_METHODS = ["transfer", "cash", "card", "cheque"] as const;
export type PaymentMethod = (typeof INVOICE_METHODS)[number];

/** The shop's accounts: the bank a non-cash payment was paid into. */
export const BANKS = ["Access Bank", "GT Bank"] as const;
export type Bank = (typeof BANKS)[number];

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: "Transfer",
  cash: "Cash",
  card: "Card",
  cheque: "Cheque",
};

/** Label for a stored method; tolerates values saved before the list changed. */
export function methodLabel(method: string): string {
  return METHOD_LABELS[method as PaymentMethod] ?? method.charAt(0).toUpperCase() + method.slice(1);
}

export function formatDocumentNumber(value: number): string {
  return String(value).padStart(7, "0");
}

const ones = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const scales = ["", " thousand", " million", " billion", " trillion"];

function belowThousand(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (hundreds) parts.push(`${ones[hundreds]} hundred`);
  if (rest) {
    const tail = rest < 20 ? ones[rest] : `${tens[Math.floor(rest / 10)]}${rest % 10 ? `-${ones[rest % 10]}` : ""}`;
    parts.push(hundreds ? `and ${tail}` : tail);
  }
  return parts.join(" ");
}

function integerToWords(value: bigint): string {
  if (value === ZERO) return "zero";
  const groups: string[] = [];
  let remaining = value;
  let scale = 0;
  while (remaining > ZERO) {
    const group = Number(remaining % BigInt(1000));
    if (group) groups.unshift(`${belowThousand(group)}${scales[scale] ?? ""}`);
    remaining /= BigInt(1000);
    scale += 1;
  }
  // "one million, five" reads as "one million and five" in Nigerian usage.
  if (groups.length > 1 && !/\band\b/.test(groups[groups.length - 1]) && Number(value % BigInt(1000)) < 100 && Number(value % BigInt(1000)) > 0) {
    groups[groups.length - 1] = `and ${groups[groups.length - 1]}`;
  }
  return groups.join(" ");
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "175000" -> "One hundred and seventy-five thousand naira only". */
export function nairaToWords(amount: string | MoneyKobo): string {
  const kobo = typeof amount === "bigint" ? amount : parseNairaToKobo(amount);
  const naira = kobo / HUNDRED;
  const remainder = Number(kobo % HUNDRED);
  const nairaWords = `${integerToWords(naira)} naira`;
  const koboWords = remainder ? ` and ${integerToWords(BigInt(remainder))} kobo` : "";
  return `${capitalise(nairaWords)}${koboWords} only`;
}

/** A line's price as a normalised decimal string ("130000" -> "130000.00"). */
export function normalizeAmount(amount: string | null | undefined): string {
  const value = amount?.trim();
  if (!value) throw new Error("Each item needs a price.");
  return koboToNairaDecimal(parseNairaToKobo(value));
}

/** Sum of normalised decimal amounts, e.g. a garment's subtotal. */
export function sumAmounts(amounts: string[]): string {
  return koboToNairaDecimal(amounts.reduce<MoneyKobo>((sum, value) => sum + parseNairaToKobo(value), ZERO));
}

export type PaymentStatus = "unpaid" | "part_paid" | "paid";

export interface InvoiceBalance {
  total: string;
  paid: string;
  balance: string;
  paymentStatus: PaymentStatus;
}

/** Totals derived from lines and live (non-voided) payments; never stored. */
export function summarizeInvoice(lineAmounts: string[], paymentAmounts: string[]): InvoiceBalance {
  const total = lineAmounts.reduce<MoneyKobo>((sum, value) => sum + parseNairaToKobo(value), ZERO);
  const paid = paymentAmounts.reduce<MoneyKobo>((sum, value) => sum + parseNairaToKobo(value), ZERO);
  const balance = total - paid;
  return {
    total: koboToNairaDecimal(total),
    paid: koboToNairaDecimal(paid),
    balance: koboToNairaDecimal(balance < ZERO ? ZERO : balance),
    paymentStatus: paid === ZERO ? "unpaid" : paid >= total && total > ZERO ? "paid" : "part_paid",
  };
}

/** Whole-naira only: the shop does not deal in kobo. */
export function isWholeNaira(value: string): boolean {
  return /^\d+(?:\.00?)?$/.test(value.trim());
}

/** Today's date (yyyy-mm-dd) in Lagos, so late-evening entries get the right day. */
export function todayInLagos(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(now);
}

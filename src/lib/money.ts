const DECIMAL_MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export type MoneyKobo = bigint;

/**
 * Parse a Naira decimal string without passing through JavaScript floating
 * point arithmetic. All authoritative money values use this boundary.
 */
export function parseNairaToKobo(value: string): MoneyKobo {
  const normalized = value.trim();
  if (!DECIMAL_MONEY_PATTERN.test(normalized)) {
    throw new Error("Money must be a non-negative decimal with at most two fractional digits.");
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const whole = wholePart.replace(/^0+(?=\d)/, "") || "0";
  const fractional = `${fractionalPart}00`.slice(0, 2);
  return BigInt(whole) * BigInt(100) + BigInt(fractional);
}

export function isValidNairaDecimal(value: string): boolean {
  try {
    parseNairaToKobo(value);
    return true;
  } catch {
    return false;
  }
}

export function isPositiveNairaDecimal(value: string): boolean {
  try {
    return parseNairaToKobo(value) > BigInt(0);
  } catch {
    return false;
  }
}

export function koboToNairaDecimal(kobo: MoneyKobo): string {
  const sign = kobo < BigInt(0) ? "-" : "";
  const absolute = kobo < BigInt(0) ? -kobo : kobo;
  const whole = absolute / BigInt(100);
  const fractional = (absolute % BigInt(100)).toString().padStart(2, "0");
  return `${sign}${whole.toString()}.${fractional}`;
}

export function multiplyNairaDecimal(value: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Quantity must be a non-negative integer.");
  }
  return koboToNairaDecimal(parseNairaToKobo(value) * BigInt(quantity));
}

export function sumNairaDecimals(values: string[]): string {
  const total = values.reduce<MoneyKobo>(
    (sum, value) => sum + parseNairaToKobo(value),
    BigInt(0),
  );
  return koboToNairaDecimal(total);
}

export function formatKobo(kobo: MoneyKobo): string {
  const sign = kobo < BigInt(0) ? "-" : "";
  const absolute = kobo < BigInt(0) ? -kobo : kobo;
  const whole = (absolute / BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fractional = (absolute % BigInt(100)).toString().padStart(2, "0");
  return `₦${sign}${whole}${fractional === "00" ? "" : `.${fractional}`}`;
}

export function formatNairaDecimal(value: string): string {
  return formatKobo(parseNairaToKobo(value));
}

/** Convert an exact integer-kobo value only at the Paystack JSON boundary. */
export function toPaystackAmount(kobo: MoneyKobo): number {
  if (kobo < BigInt(0) || kobo > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Payment amount is outside Paystack's supported safe range.");
  }
  const amount = Number(kobo);
  if (!Number.isSafeInteger(amount)) {
    throw new Error("Payment amount is outside Paystack's supported safe range.");
  }
  return amount;
}

/** Convert Paystack's integer response back to exact integer kobo. */
export function parsePaystackAmount(amount: number): MoneyKobo {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("Paystack returned an invalid amount.");
  }
  return BigInt(amount);
}

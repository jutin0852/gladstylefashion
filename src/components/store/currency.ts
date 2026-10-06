import { formatKobo, parseNairaToKobo, type MoneyKobo } from "@/lib/money";

export function formatStorePrice(value: string | MoneyKobo) {
  return formatKobo(typeof value === "bigint" ? value : parseNairaToKobo(value));
}

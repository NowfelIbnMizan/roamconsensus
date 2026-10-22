/** Currencies travellers can view prices in. Prices are stored in the creator's currency (mostly USD). */
export const CURRENCIES = [
  { code: "USD", label: "US dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British pound" },
  { code: "AUD", label: "Australian dollar" },
  { code: "CAD", label: "Canadian dollar" },
  { code: "SGD", label: "Singapore dollar" },
  { code: "IDR", label: "Indonesian rupiah" },
  { code: "THB", label: "Thai baht" },
  { code: "JPY", label: "Japanese yen" },
  { code: "KRW", label: "South Korean won" },
] as const;

/** Units of each currency per 1 USD. */
export type Rates = Record<string, number>;

/** Used when the live rates can't be fetched. Rough, so prices stay in the right ballpark. */
export const FALLBACK_RATES: Rates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  AUD: 1.52,
  CAD: 1.37,
  SGD: 1.34,
  IDR: 16300,
  THB: 33.6,
  JPY: 158,
  KRW: 1400,
};

/** Converts minor units (cents) between currencies; an unknown currency is left as is. */
export function convertCents(cents: number, from: string, to: string, rates: Rates) {
  if (from === to || !rates[from] || !rates[to]) return { cents, currency: from };
  return { cents: Math.round((cents / rates[from]) * rates[to]), currency: to };
}

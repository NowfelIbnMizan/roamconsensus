export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

/** Price for a line: total when known, else the creator's wording, else "Price not listed". */
export function formatPrice(item: { priceCents: number | null; quantity: number; currency?: string; priceNote?: string | null }) {
  if (item.priceCents === null) return item.priceNote ?? "Price not listed";
  if (item.priceCents === 0) return "Free";
  return formatMoney(item.priceCents * item.quantity, item.currency);
}

export const sentimentLabel = {
  MUST_VISIT: "Must visit",
  RECOMMENDED: "Recommended",
  OPTIONAL: "Optional",
  AVOID: "Skip it",
} as const;

export const tierLabel = {
  BACKPACKER: "Backpacker",
  BUDGET: "Budget",
  MIDRANGE: "Mid-range",
  LUXURY: "Luxury",
} as const;

export const categoryLabel = {
  STAY: "Stays",
  EXPERIENCE: "Experiences",
  FOOD: "Food",
  ESIM: "Connectivity",
  GEAR: "Gear",
  TRANSIT: "Transit",
} as const;

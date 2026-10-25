export function formatMoney(cents: number, currency = "USD") {
  // Whole units, except small amounts (entry fees) that would round to $0 or $1.
  const digits = cents < 1000 && cents % 100 !== 0 ? 2 : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(cents / 100);
}

/** Price for a line: total when known, else the creator's wording, else "Price not listed". */
export function formatPrice(item: {
  priceCents: number | null;
  quantity: number;
  currency?: string;
  priceNote?: string | null;
}) {
  if (item.priceCents === null) return item.priceNote ?? "Price not listed";
  if (item.priceCents === 0) return "Free";
  return formatMoney(item.priceCents * item.quantity, item.currency);
}

/** Below this share of priced stops a route's total says little, so it shows as "Partly priced" instead. */
export const PRICED_ENOUGH = 0.7;

export function mostlyPriced(route: { unpricedCount: number; stops: number }) {
  return (
    route.stops > 0 && 1 - route.unpricedCount / route.stops >= PRICED_ENOUGH
  );
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

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

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

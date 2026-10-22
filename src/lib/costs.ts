import type { Tier } from "@/generated/prisma/enums";

export const STYLES = [
  { key: "backpacker", label: "Backpacker", tiers: ["BACKPACKER", "BUDGET"] as Tier[] },
  { key: "midrange", label: "Mid-range", tiers: ["MIDRANGE"] as Tier[] },
  { key: "luxury", label: "Luxury", tiers: ["LUXURY"] as Tier[] },
] as const;

export type Style = (typeof STYLES)[number]["key"];

/** Typical spend in USD: per person per day, except stayPerNight, which is per room. */
export type DailyCosts = { food: number; localTransport: number; activities: number; stayPerNight: number };

export type CostGuide = { checked: string; styles: Record<Style, DailyCosts>; sources: string[] };

/**
 * Typical daily costs per destination slug, for the budget calculator. Stays come from the creators' own hotel
 * picks where there are any; stayPerNight is the fallback. Recheck the figures when the sources update.
 */
export const costGuides: Record<string, CostGuide> = {
  // BudgetYourTrip's budget / mid-range / luxury tables. stayPerNight is its double-room price (it quotes per person,
  // half a room). Tokyo uses tokyotourism.org's yen table (converted at 158.33, rooms as quoted). Cities with only a
  // single average (Kyoto) are left out rather than guessed.
  bangkok: {
    checked: "October 2026",
    styles: {
      backpacker: { food: 13, localTransport: 2, activities: 6, stayPerNight: 36 },
      midrange: { food: 34, localTransport: 6, activities: 17, stayPerNight: 96 },
      luxury: { food: 91, localTransport: 20, activities: 49, stayPerNight: 274 },
    },
    sources: ["https://www.budgetyourtrip.com/thailand/bangkok"],
  },
  singapore: {
    checked: "October 2026",
    styles: {
      backpacker: { food: 19, localTransport: 4.31, activities: 13, stayPerNight: 76 },
      midrange: { food: 48, localTransport: 11, activities: 34, stayPerNight: 204 },
      luxury: { food: 121, localTransport: 27, activities: 89, stayPerNight: 570 },
    },
    sources: ["https://www.budgetyourtrip.com/singapore"],
  },
  bali: {
    checked: "October 2026",
    styles: {
      backpacker: { food: 13, localTransport: 3, activities: 3, stayPerNight: 26 },
      midrange: { food: 32, localTransport: 8, activities: 10, stayPerNight: 76 },
      luxury: { food: 80, localTransport: 30, activities: 33, stayPerNight: 254 },
    },
    sources: ["https://www.budgetyourtrip.com/indonesia/bali/trip-cost-1645528"],
  },
  seoul: {
    checked: "October 2026",
    styles: {
      backpacker: { food: 21, localTransport: 6, activities: 10, stayPerNight: 44 },
      midrange: { food: 53, localTransport: 16, activities: 27, stayPerNight: 112 },
      luxury: { food: 141, localTransport: 49, activities: 82, stayPerNight: 280 },
    },
    sources: ["https://www.budgetyourtrip.com/south-korea/seoul/trip-cost-1835848"],
  },
  hanoi: {
    checked: "October 2026",
    styles: {
      backpacker: { food: 9, localTransport: 2, activities: 3, stayPerNight: 18 },
      midrange: { food: 23, localTransport: 7, activities: 8, stayPerNight: 50 },
      luxury: { food: 59, localTransport: 20, activities: 28, stayPerNight: 160 },
    },
    sources: ["https://www.budgetyourtrip.com/vietnam/hanoi"],
  },
  "kuala-lumpur": {
    checked: "October 2026",
    styles: {
      backpacker: { food: 11, localTransport: 3, activities: 6, stayPerNight: 30 },
      midrange: { food: 30, localTransport: 7, activities: 16, stayPerNight: 84 },
      luxury: { food: 88, localTransport: 24, activities: 43, stayPerNight: 268 },
    },
    sources: ["https://www.budgetyourtrip.com/malaysia/kuala-lumpur"],
  },
  osaka: {
    checked: "October 2026",
    styles: {
      backpacker: { food: 18, localTransport: 5, activities: 8, stayPerNight: 38 },
      midrange: { food: 42, localTransport: 13, activities: 20, stayPerNight: 90 },
      luxury: { food: 87, localTransport: 31, activities: 51, stayPerNight: 200 },
    },
    sources: ["https://www.budgetyourtrip.com/japan/osaka"],
  },
  "chiang-mai": {
    checked: "October 2026",
    styles: {
      backpacker: { food: 8, localTransport: 2, activities: 5, stayPerNight: 20 },
      midrange: { food: 20, localTransport: 4, activities: 14, stayPerNight: 58 },
      luxury: { food: 50, localTransport: 11, activities: 45, stayPerNight: 180 },
    },
    sources: ["https://www.budgetyourtrip.com/thailand/chiang-mai/trip-cost-1153671"],
  },
  phuket: {
    checked: "October 2026",
    styles: {
      backpacker: { food: 16, localTransport: 4, activities: 18, stayPerNight: 48 },
      midrange: { food: 42, localTransport: 12, activities: 47, stayPerNight: 124 },
      luxury: { food: 108, localTransport: 35, activities: 125, stayPerNight: 330 },
    },
    sources: ["https://www.budgetyourtrip.com/thailand/phuket/trip-cost-1151254"],
  },
  tokyo: {
    checked: "October 2026",
    styles: {
      backpacker: { food: 18, localTransport: 6, activities: 6, stayPerNight: 22 },
      midrange: { food: 38, localTransport: 9, activities: 19, stayPerNight: 88 },
      luxury: { food: 88, localTransport: 22, activities: 51, stayPerNight: 284 },
    },
    sources: ["https://www.tokyotourism.org/tokyo-trip-cost/"],
  },
};

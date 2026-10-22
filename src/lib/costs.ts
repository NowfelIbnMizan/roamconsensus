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
  // half a room). Cities it only gives a single average for are left out rather than guessed.
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
};

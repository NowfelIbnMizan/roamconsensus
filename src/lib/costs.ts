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

/** A city's cost guide, as saved in admin (Destination.costGuide), or null when it has none yet. */
export function costGuideOf(d: { costGuide?: unknown }): CostGuide | null {
  const g = d.costGuide as CostGuide | null | undefined;
  return g && g.styles ? g : null;
}

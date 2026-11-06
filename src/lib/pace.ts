import type { ItemCategory } from "@/generated/prisma/enums";

/**
 * How full a day is, as a rough guess: about 1.5 hours per sight or activity, 1 hour per meal stop, plus time on the
 * road. Hotels, transfers and gear don't add time. Meant to flag the "27 stops in 3 days" routes, not to schedule.
 */
const HOURS: Partial<Record<ItemCategory, number>> = { EXPERIENCE: 1.5, FOOD: 1 };

export type Pace = {
  level: "easy" | "full" | "very-full";
  label: string;
  /** Rounded hours of stops plus road. */
  hours: number;
  /** Stops the creator marked optional. */
  optional: number;
};

export function dayPace(
  items: { category: ItemCategory; sentiment?: string | null }[],
  roadMinutes = 0,
): Pace | null {
  const hours = items.reduce((h, i) => h + (HOURS[i.category] ?? 0), 0) + roadMinutes / 60;
  if (hours === 0) return null;
  const optional = items.filter((i) => i.sentiment === "OPTIONAL").length;
  const level = hours <= 5 ? "easy" : hours <= 9 ? "full" : "very-full";
  return {
    level,
    label: level === "easy" ? "Easy day" : level === "full" ? "Full day" : "Very full day",
    hours: Math.max(1, Math.round(hours)),
    optional,
  };
}

export const PACE_HINT =
  "Rough guess: about 1.5 h per sight, 1 h per meal stop, plus road time. Skip what you don't care about.";

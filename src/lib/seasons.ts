import type { Crowd } from "@/generated/prisma/enums";

export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type MonthInfo = {
  month: number;
  highC: number | null;
  lowC: number | null;
  rainMm: number | null;
  crowd: Crowd | null;
  note: string | null;
};

export type Rating = "great" | "good" | "wet";

/** Dry and not packed is "great"; dry but crowded, or damp but quiet, is "good"; heavy rain is "wet". */
export function rateMonth(m: MonthInfo): Rating {
  const rain = m.rainMm ?? 0;
  if (rain < 100) return m.crowd === "HIGH" ? "good" : "great";
  if (rain < 200 && m.crowd === "LOW") return "good";
  return "wet";
}

export const ratingLabel: Record<Rating, string> = { great: "Best time", good: "Good", wet: "Rainy" };

export const crowdLabel: Record<Crowd, string> = { LOW: "Quiet", MEDIUM: "Moderate", HIGH: "Busy" };

/** "Apr–May, Sep–Oct": runs of great months, wrapping round the year end. */
export function bestMonths(months: MonthInfo[]) {
  const great = new Set(months.filter((m) => rateMonth(m) === "great").map((m) => m.month));
  if (great.size === 0 || great.size === 12) return null;
  // Start the scan just after a month that isn't great so a Dec–Jan run stays in one piece.
  const start = [...Array(12)].map((_, i) => i + 1).find((m) => !great.has(m))!;
  const runs: number[][] = [];
  for (let i = 1; i <= 12; i++) {
    const m = ((start + i - 1) % 12) + 1;
    if (!great.has(m)) continue;
    const last = runs.at(-1);
    if (last && (last.at(-1)! % 12) + 1 === m) last.push(m);
    else runs.push([m]);
  }
  return runs
    .map((r) => (r.length === 1 ? monthNames[r[0] - 1] : `${monthNames[r[0] - 1]}–${monthNames[r.at(-1)! - 1]}`))
    .join(", ");
}

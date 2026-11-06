import type { ItemCategory } from "@/generated/prisma/enums";

/**
 * What a route's total actually covers: how many of its stops have a price, which kinds of cost those are, and when a
 * researched price was last checked. Shown beside every total so "$50" never reads as a full trip quote.
 */
export type PriceScope = {
  /** Stops that count (not "skip it", not closed). */
  stops: number;
  /** Of those, how many have a price (free counts as priced). */
  priced: number;
  /** Kinds of cost with at least one price, in a fixed order. */
  covers: ItemCategory[];
  /** Latest "checked" date on a researched price, as YYYY-MM-DD; null when every price is the creator's own. */
  checkedAt: string | null;
};

type ScopedItem = {
  category: ItemCategory;
  priceCents: number | null;
  sentiment?: string | null;
  priceCheckedAt?: Date | string | null;
  place?: { closed: boolean } | null;
  closedNote?: string | null;
};

const ORDER: ItemCategory[] = ["STAY", "FOOD", "EXPERIENCE", "TRANSIT", "ESIM", "GEAR"];

export function priceScope(items: ScopedItem[]): PriceScope {
  const kept = items.filter((i) => i.sentiment !== "AVOID" && !i.place?.closed && !i.closedNote);
  const priced = kept.filter((i) => i.priceCents !== null);
  const kinds = new Set(priced.map((i) => i.category));
  const checked = priced
    .map((i) => (i.priceCheckedAt ? new Date(i.priceCheckedAt).getTime() : 0))
    .reduce((a, b) => Math.max(a, b), 0);
  return {
    stops: kept.length,
    priced: priced.length,
    covers: ORDER.filter((c) => kinds.has(c)),
    checkedAt: checked ? new Date(checked).toISOString().slice(0, 10) : null,
  };
}

const coverWord: Record<ItemCategory, string> = {
  STAY: "hotels",
  FOOD: "food",
  EXPERIENCE: "things to do",
  TRANSIT: "getting around",
  ESIM: "eSIM",
  GEAR: "gear",
};

/** "hotels, food and things to do" */
export function listWords(words: string[]) {
  return words.length < 2 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}

/** What the total includes and what it leaves out, as two short phrases. */
export function scopeWords(scope: PriceScope) {
  const covers = scope.covers.filter((c) => c !== "GEAR").map((c) => coverWord[c]);
  const missing = (["STAY", "FOOD", "TRANSIT"] as ItemCategory[])
    .filter((c) => !scope.covers.includes(c))
    .map((c) => coverWord[c]);
  return {
    covers: covers.length ? listWords(covers) : null,
    leavesOut: listWords(["flights", ...missing, "shopping"]),
  };
}

/** "Oct 2026" */
export function checkedLabel(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

import type { getDestination } from "@/lib/data";
import type { ItemCategory } from "@/generated/prisma/enums";
import { distanceKm, hasPin } from "@/lib/map";

type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
type Place = Destination["consensus"][number];
type Stop = { category: ItemCategory; placeSlug: string | null; area: string | null; lat: number | null; lng: number | null; sentiment: string | null };

export type Gap = {
  category: "STAY" | "FOOD" | "EXPERIENCE";
  picks: { place: Place; others: number; km: number | null }[];
};

const PICKS = 3;
/** Farther than this isn't "near" that day's stops, on an island or in a city. */
const NEAR_KM = 15;

/**
 * What a route's day leaves out (no food, no sight, or no hotel anywhere on a multi-day route), filled only with
 * places other creators on the site recommend near that day's stops. Nothing is invented: no place, no pick.
 */
export function routeGaps(
  days: { day: number; items: Stop[] }[],
  routeDays: number,
  creatorHandle: string,
  city: Destination,
) {
  const inRoute = new Set(days.flatMap((d) => d.items.flatMap((i) => (i.placeSlug ? [i.placeSlug] : []))));
  const others = (p: Place) => p.creators.filter((c) => c.handle !== creatorHandle).length;
  const candidates = city.consensus.filter(
    (p) => !p.closed && p.cartItem && !inRoute.has(p.slug) && others(p) > 0 && p.skippedBy.length < p.creators.length,
  );
  const hasStay = days.some((d) => d.items.some((i) => i.category === "STAY" && i.sentiment !== "AVOID"));

  const gaps = new Map<number, Gap[]>();
  days.forEach(({ day, items }, index) => {
    const going = items.filter((i) => i.sentiment !== "AVOID");
    const pins = going.filter(hasPin);
    const areas = new Set(going.flatMap((i) => (i.area ? [i.area] : [])));
    const near = (p: Place) => {
      if (pins.length && hasPin(p)) return Math.min(...pins.map((s) => distanceKm(s, p)));
      return null;
    };
    const missing: Gap["category"][] = [];
    if (!hasStay && routeDays > 1 && index === 0) missing.push("STAY");
    if (!going.some((i) => i.category === "FOOD")) missing.push("FOOD");
    if (!going.some((i) => i.category === "EXPERIENCE")) missing.push("EXPERIENCE");
    const found: Gap[] = [];
    for (const category of missing) {
      const picks = candidates
        .filter((p) => p.category === category)
        .map((p) => ({ place: p, others: others(p), km: near(p) }))
        // With pins, nearby only; without, the same area as the day's stops.
        .filter((c) => (c.km !== null ? c.km <= NEAR_KM : c.place.area !== null && areas.has(c.place.area)))
        .sort((a, b) => b.others - a.others || (a.km ?? 0) - (b.km ?? 0))
        .slice(0, PICKS);
      if (picks.length) found.push({ category, picks });
    }
    if (found.length) gaps.set(day, found);
  });
  return gaps;
}

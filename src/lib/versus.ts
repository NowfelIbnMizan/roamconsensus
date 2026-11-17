import { costGuideOf } from "@/lib/costs";
import type { getDestination } from "@/lib/data";
import { mostlyPriced } from "@/lib/format";
import { bestMonths } from "@/lib/seasons";

type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;

/**
 * City pairs travellers weigh against each other ("Phuket or Krabi?"). A pair only gets a page while both cities are
 * live with enough routes (see MIN_ROUTES); add a pair here and its page, sitemap entry and city-page links follow.
 */
export const VERSUS: readonly (readonly [string, string])[] = [
  ["phuket", "krabi"],
  ["kyoto", "osaka"],
  ["tokyo", "kyoto"],
  ["bangkok", "chiang-mai"],
  ["bali", "phuket"],
  ["barcelona", "madrid"],
];

/** Under this many routes a city has nothing to set against another. */
export const MIN_ROUTES = 2;

export const versusHref = (a: string, b: string) => `/compare/${a}-vs-${b}`;

/** The pair a URL names, in its listed order only: the reversed URL is not a second page. */
export function versusPair(param: string) {
  return VERSUS.find(([a, b]) => `${a}-vs-${b}` === param) ?? null;
}

/** Pairs that include a city, each with the other city's slug. */
export function versusFor(slug: string) {
  return VERSUS.flatMap(([a, b]) => (a === slug || b === slug ? [{ a, b, other: a === slug ? b : a }] : []));
}

/** Pairs whose two cities are both live with enough routes. */
export function liveVersus(cities: { slug: string; _count: { itineraries: number } }[]) {
  const ok = new Set(cities.filter((c) => c._count.itineraries >= MIN_ROUTES).map((c) => c.slug));
  return VERSUS.filter(([a, b]) => ok.has(a) && ok.has(b));
}

/** One city's side of a comparison, from its routes and guides only. Anything the data doesn't cover is null. */
export function cityFacts(d: Destination) {
  const days = d.routes.map((r) => r.days).sort((a, b) => a - b);
  // Only totals that include a hotel and most stops can be set side by side.
  const perDay = d.routes
    .filter((r) => !r.sightsOnly && !r.noStay && r.totalCents > 0 && mostlyPriced(r))
    .map((r) => Math.round(r.totalCents / r.days))
    .sort((a, b) => a - b);
  const guide = costGuideOf(d)?.styles.midrange;
  const picks = d.consensus.filter(
    (p) => (p.category === "EXPERIENCE" || p.category === "FOOD") && p.creators.length > 0 && p.skippedBy.length === 0,
  );
  return {
    routes: d.routes.length,
    creators: d.creatorCount,
    minDays: days.length ? days[0] : null,
    maxDays: days.at(-1) ?? null,
    pricedRoutes: perDay.length,
    dayLowCents: perDay.length ? perDay[0] : null,
    dayHighCents: perDay.at(-1) ?? null,
    /** Mid-range spend per person per day in cents, with half a double room, from the city's cost guide. */
    guideDayCents: guide
      ? Math.round(guide.food + guide.localTransport + guide.activities + guide.stayPerNight / 2) * 100
      : null,
    best: bestMonths(d.months),
    shared: picks.filter((p) => p.creators.length >= 2).length,
    top: picks.slice(0, 5),
  };
}

export type CityFacts = ReturnType<typeof cityFacts>;

/**
 * "Pick this one if…" lines for the first city, each from a number it wins on. No opinions: a tie or a missing number
 * gives no line.
 */
export function reasonsFor(mine: CityFacts, other: CityFacts) {
  const reasons: string[] = [];
  if (mine.routes > other.routes) reasons.push(`You want more routes to choose from: ${mine.routes}, against ${other.routes}.`);
  if (mine.minDays !== null && other.minDays !== null && mine.minDays < other.minDays)
    reasons.push(`You are short on time: routes start at ${mine.minDays} ${mine.minDays === 1 ? "day" : "days"}.`);
  if (mine.maxDays !== null && other.maxDays !== null && mine.maxDays > other.maxDays && mine.maxDays >= 5)
    reasons.push(`You have longer: routes run up to ${mine.maxDays} days.`);
  if (mine.shared > other.shared)
    reasons.push(`You like a sure thing: ${mine.shared} places are picked by two or more creators, against ${other.shared}.`);
  return reasons;
}

import type { getDestination } from "@/lib/data";
import { formatMoney, mostlyPriced } from "@/lib/format";

type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
type Route = Destination["routes"][number];

/** A list page only exists with this much behind it; fewer and it would be a thin copy of the city page. */
export const MIN_PLACES = 5;
export const MIN_ROUTES = 2;

const BUDGET_TIERS = new Set(["BACKPACKER", "BUDGET"]);

export const areaSlug = (area: string) =>
  area
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Places in an area that a visitor goes to (sights and food), most-picked first. */
const areaPlaces = (d: Destination, area: string) =>
  d.consensus.filter((p) => p.area === area && (p.category === "EXPERIENCE" || p.category === "FOOD"));

export const foodPlaces = (d: Destination) => d.consensus.filter((p) => p.category === "FOOD");
export const budgetRoutes = (d: Destination) => d.routes.filter((r) => BUDGET_TIERS.has(r.tier));
export const routesOfLength = (d: Destination, days: number) => d.routes.filter((r) => r.days === days);
export const midRangeRoutes = (d: Destination) => d.routes.filter((r) => r.tier === "MIDRANGE");
export const luxuryRoutes = (d: Destination) => d.routes.filter((r) => r.tier === "LUXURY");

/** Enough routes for a list, but not every route the city has (that list is the city page itself). */
const worthAList = (d: Destination, routes: Route[]) => routes.length >= MIN_ROUTES && routes.length < d.routes.length;

/** Every list page a city has enough data for. */
export function cityCollections(d: Destination) {
  const areaNames = [...new Set(d.consensus.flatMap((p) => (p.area ? [p.area] : [])))];
  const areas = areaNames
    .map((name) => ({ name, slug: areaSlug(name), places: areaPlaces(d, name) }))
    .filter((a) => a.places.length >= MIN_PLACES)
    .sort((a, b) => b.places.length - a.places.length);
  const lengths = [...new Set(d.routes.map((r) => r.days))]
    .filter((n) => routesOfLength(d, n).length >= MIN_ROUTES)
    .sort((a, b) => a - b);
  return {
    eat: foodPlaces(d).length >= MIN_PLACES,
    areas,
    lengths,
    budget: budgetRoutes(d).length >= MIN_ROUTES,
    midRange: worthAList(d, midRangeRoutes(d)),
    luxury: worthAList(d, luxuryRoutes(d)),
  };
}

export function collectionPaths(d: Destination) {
  const c = cityCollections(d);
  const base = `/destinations/${d.slug}`;
  return [
    ...(c.eat ? [`${base}/eat`] : []),
    ...(c.budget ? [`${base}/on-a-budget`] : []),
    ...(c.midRange ? [`${base}/mid-range`] : []),
    ...(c.luxury ? [`${base}/luxury`] : []),
    ...c.lengths.map((n) => `${base}/days/${n}`),
    ...c.areas.map((a) => `${base}/areas/${a.slug}`),
  ];
}

export function findArea(d: Destination, slug: string) {
  return cityCollections(d).areas.find((a) => a.slug === slug) ?? null;
}

/** Places that two or more of these routes include, most-shared first. */
export function sharedPlaces(d: Destination, routes: Route[]) {
  const count = new Map<string, number>();
  for (const r of routes) for (const p of r.places) count.set(p, (count.get(p) ?? 0) + 1);
  return d.consensus
    .filter((p) => p.category !== "TRANSIT" && (count.get(p.slug) ?? 0) >= 2)
    .map((p) => ({ slug: p.slug, name: p.name, routes: count.get(p.slug)! }))
    .sort((a, b) => b.routes - a.routes);
}

/** Cheapest a day first; sights-only routes and routes without a hotel price go last (their totals leave big costs out). */
export const byDayCost = (a: Route, b: Route) => {
  const key = (r: Route) => (r.sightsOnly || r.noStay ? 1e12 : 0) + (r.totalCents ? r.totalCents / r.days : 1e11);
  return key(a) - key(b);
};

/** Routes whose total can stand for the trip's cost: a hotel is priced and so are most stops. Cheapest a day first. */
export const fullyCosted = (routes: Route[]) =>
  routes.filter((r) => !r.sightsOnly && !r.noStay && r.totalCents > 0 && mostlyPriced(r)).sort(byDayCost);

const range = (xs: number[], show: (n: number) => string) => {
  const low = Math.min(...xs);
  const high = Math.max(...xs);
  return low === high ? show(low) : `${show(low)} to ${show(high)}`;
};

/**
 * What these routes cost per person, in USD, from the ones that price a hotel and most stops: "$143 to $377" for the
 * whole trip, or a day when `perDay` is set. Null when no route qualifies, so a page never leads with a partial total.
 */
export function costSpan(routes: Route[], perDay = false) {
  const costed = fullyCosted(routes);
  if (!costed.length) return null;
  return {
    text: range(
      costed.map((r) => (perDay ? Math.round(r.totalCents / r.days) : r.totalCents)),
      (cents) => formatMoney(Math.round(cents / 100) * 100),
    ),
    routes: costed.length,
  };
}

/** "12 to 23 stops" across these routes. */
export const stopSpan = (routes: Route[]) =>
  routes.length ? `${range(routes.map((r) => r.stops), String)} ${routes.every((r) => r.stops === 1) ? "stop" : "stops"}` : null;

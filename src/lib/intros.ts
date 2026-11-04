import Anthropic from "@anthropic-ai/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { CONTENT_TAG, getDestination, getDestinations } from "@/lib/data";
import {
  budgetRoutes,
  cityCollections,
  collectionPaths,
  findArea,
  foodPlaces,
  luxuryRoutes,
  midRangeRoutes,
  routesOfLength,
  sharedPlaces,
} from "@/lib/collections";
import { countryHref, getCountries, getCountry } from "@/lib/countries";
import { tierLabel } from "@/lib/format";

/** The approved intro for a page, or null. Drafts never show on the site. */
export async function getIntro(path: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const row = await db.pageIntro.findUnique({ where: { path }, select: { text: true } });
  return row?.text ?? null;
}

/** Every list page that can carry an intro, country pages first. */
export async function introPages() {
  const [countries, cities] = await Promise.all([getCountries(), getDestinations()]);
  const full = await Promise.all(cities.map((c) => getDestination(c.slug)));
  return [
    ...countries.map((c) => countryHref(c.name)),
    ...full.flatMap((d) => (d ? collectionPaths(d) : [])),
  ];
}

type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
type Route = Destination["routes"][number];

const routeLine = (r: Route) =>
  `- "${r.title}" by ${r.creator.name}: ${r.days} ${r.days === 1 ? "day" : "days"}, ${tierLabel[r.tier]}, ${r.stops} stops`;

function routeFacts(d: Destination, heading: string, routes: Route[]) {
  const shared = sharedPlaces(d, routes).slice(0, 6);
  return [
    heading,
    `${routes.length} routes:`,
    ...routes.map(routeLine),
    shared.length
      ? `Places several of these routes include: ${shared.map((p) => `${p.name} (${p.routes} of ${routes.length})`).join(", ")}.`
      : "These routes share no places.",
  ].join("\n");
}

/** Plain facts about a page, from the site's own data: all an intro may say. Null when the page doesn't exist. */
export async function pageFacts(path: string): Promise<string | null> {
  const country = path.match(/^\/countries\/([^/]+)$/);
  if (country) {
    const c = await getCountry(country[1]);
    if (!c) return null;
    const routes = c.cities.flatMap((d) => d.routes);
    return [
      `Page: travel itineraries for ${c.name}, across ${c.cities.length} cities.`,
      ...c.cities.map(
        (d) =>
          `${d.name}: ${d.routes.length} ${d.routes.length === 1 ? "route" : "routes"} (${d.routes.map((r) => `${r.days}d ${tierLabel[r.tier]} by ${r.creator.name}`).join("; ")}).`,
      ),
      `Total: ${routes.length} routes from ${new Set(routes.map((r) => r.creator.name)).size} creators.`,
    ].join("\n");
  }
  const m = path.match(/^\/destinations\/([^/]+)\/(.+)$/);
  if (!m) return null;
  const d = await getDestination(m[1]);
  if (!d) return null;
  const c = cityCollections(d);
  const [kind, arg] = m[2].split("/");
  if (kind === "on-a-budget" && c.budget) return routeFacts(d, `Page: ${d.name} on a budget (backpacker and budget routes).`, budgetRoutes(d));
  if (kind === "mid-range" && c.midRange) return routeFacts(d, `Page: mid-range ${d.name} routes.`, midRangeRoutes(d));
  if (kind === "luxury" && c.luxury) return routeFacts(d, `Page: luxury ${d.name} routes.`, luxuryRoutes(d));
  if (kind === "days" && c.lengths.includes(Number(arg)))
    return routeFacts(d, `Page: ${arg} days in ${d.name}.`, routesOfLength(d, Number(arg)));
  const placeLines = (places: Destination["consensus"]) =>
    places.slice(0, 10).map((p) => `- ${p.name}${p.area ? ` (${p.area})` : ""}: recommended by ${p.creators.length} creator(s)`);
  if (kind === "eat" && c.eat)
    return [`Page: where to eat in ${d.name}, ${foodPlaces(d).length} food places.`, ...placeLines(foodPlaces(d))].join("\n");
  if (kind === "areas" && arg) {
    const a = findArea(d, arg);
    if (a) return [`Page: things to do in ${a.name}, ${d.name}. ${a.places.length} places.`, ...placeLines(a.places)].join("\n");
  }
  return null;
}

export const canDraft = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `You write the two-sentence intro at the top of a list page on Creatour, a free site that collects travel creators' public itineraries and shows where they agree.
Use only the facts given. Never add a place, price, opinion, season or claim that is not in the facts. Never say you or the site owner visited anything. No hype words (stunning, ultimate, hidden gem, must-see).
Plain, short sentences a traveller can scan. Name numbers from the facts. At most 45 words. Reply with the intro text only.`;

/** A first draft for the owner to edit. Costs a fraction of a cent per page. */
export async function draftIntro(facts: string) {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low" },
    system: SYSTEM,
    messages: [{ role: "user", content: facts }],
  });
  if (response.stop_reason === "refusal") throw new Error("The AI declined to write this one.");
  return response.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("")
    .trim();
}

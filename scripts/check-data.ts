// Quality check for data/destinations/*.json, run before a content PR: `npm run check:data`.
// The seed already rejects broken files (unknown place, bad URL); this catches what loads fine but looks wrong on
// the site. Problems fail the run; warnings are worth a look but can stand (a creator who gives no prices).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type Place = { slug: string; name: string; category: string; lat?: number; lng?: number; website?: string };
type Item = {
  day: number;
  name: string;
  category: string;
  price?: number;
  priceNote?: string;
  priceSource?: string;
  sentiment?: string;
  note?: string;
  place?: string;
};
type Itinerary = { slug: string; title: string; days: number; tier: string; creator: string; items: Item[] };
type Destination = { slug: string; places: Place[]; itineraries: Itinerary[] };

/** Same share as the site's "Partly priced" cut-off (src/lib/format.ts). */
const PRICED_ENOUGH = 0.7;
/** Two stops this close (degrees, about 100 m) with similar names are likely the same place. */
const NEAR = 0.001;

const dir = path.join(process.cwd(), "data/destinations");
const problems: string[] = [];
const warnings: string[] = [];
const seenItineraries = new Set<string>();

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a)\b/g, "")
    .trim();

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const d: Destination = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
  const where = d.slug;
  const places = new Map(d.places.map((p) => [p.slug, p]));
  const used = new Set<string>();

  const byName = new Map<string, Place>();
  for (const p of d.places) {
    if (p.lat === undefined || p.lng === undefined)
      // A drive or an unnamed Airbnb has no one spot to pin.
      (p.category === "TRANSIT" || /airbnb/.test(p.slug) ? warnings : problems).push(
        `${where}: place "${p.name}" has no map pin`,
      );
    const twin = byName.get(norm(p.name));
    if (twin) problems.push(`${where}: "${p.name}" is listed twice (${twin.slug}, ${p.slug}); merge them`);
    byName.set(norm(p.name), p);
    if (p.name.includes(" / ")) warnings.push(`${where}: "${p.name}" is several places in one; split it`);
  }
  for (const [i, a] of d.places.entries())
    for (const b of d.places.slice(i + 1))
      if (
        a.lat !== undefined &&
        b.lat !== undefined &&
        Math.abs(a.lat - b.lat) < NEAR &&
        Math.abs(a.lng! - b.lng!) < NEAR &&
        (norm(a.name).includes(norm(b.name)) || norm(b.name).includes(norm(a.name)))
      )
        warnings.push(`${where}: "${a.name}" and "${b.name}" share a spot; same place?`);

  for (const it of d.itineraries) {
    const at = `${where}/${it.slug}`;
    if (seenItineraries.has(it.slug)) problems.push(`${at}: slug used twice`);
    seenItineraries.add(it.slug);

    // "3 days in Bangkok" that runs 4 days, or "3-night" luxury that runs 3.
    const titled = it.title.match(/(\d+)[- ](day|night)/i);
    if (titled && titled[2].toLowerCase() === "day" && Number(titled[1]) !== it.days && !/\bplus\b/i.test(it.title))
      problems.push(`${at}: title says ${titled[1]} days, route has ${it.days}`);

    const days = new Set(it.items.map((i) => i.day));
    for (const i of it.items)
      if (i.day < 1 || i.day > it.days) problems.push(`${at}: "${i.name}" is on day ${i.day} of ${it.days}`);
    const free = Array.from({ length: it.days }, (_, n) => n + 1).filter((n) => !days.has(n));
    if (free.length) warnings.push(`${at}: no stops on day ${free.join(", ")} (shows as a free day)`);

    // One rule for trip style, from the average hotel price per night (Fora's luxury series stays Luxury).
    const nights = it.items.filter((i) => i.category === "STAY" && i.price !== undefined).map((i) => i.price!);
    const night = nights.length ? Math.round(nights.reduce((a, b) => a + b, 0) / nights.length) : null;
    const tier =
      night === null ? null : night < 30 ? "BACKPACKER" : night < 90 ? "BUDGET" : night < 300 ? "MIDRANGE" : "LUXURY";
    const backpacker = it.tier === "BACKPACKER" && tier === "BUDGET"; // dorms are often cheaper than the room priced
    if (tier && tier !== it.tier && it.creator !== "foratravel" && !backpacker)
      warnings.push(`${at}: style is ${it.tier} but $${night}/night hotels suggest ${tier}`);

    const kept = it.items.filter((i) => i.sentiment !== "AVOID");
    const priced = kept.filter((i) => i.price !== undefined).length;
    if (kept.length && priced / kept.length < PRICED_ENOUGH)
      warnings.push(`${at}: ${priced} of ${kept.length} stops priced, so the card shows "Partly priced"`);
    if (kept.length < it.days * 2) warnings.push(`${at}: only ${kept.length} stops for ${it.days} days`);

    for (const i of it.items) {
      const place = i.place ? places.get(i.place) : undefined;
      if (i.place) used.add(i.place);
      if (i.place && !place) problems.push(`${at}: "${i.name}" points at unknown place ${i.place}`);
      if (!i.place && i.category !== "GEAR" && i.category !== "ESIM")
        warnings.push(`${at}: "${i.name}" has no place, so it's off the map`);
      if (i.price !== undefined && i.price > 0 && i.priceNote === undefined && i.priceSource === undefined)
        warnings.push(`${at}: "${i.name}" has a price but no note saying what it covers`);
      if (place && (i.category === "STAY" || i.category === "FOOD") && !place.website)
        warnings.push(`${at}: ${i.category === "STAY" ? "hotel" : "restaurant"} "${i.name}" has no website`);
    }
  }
  for (const p of d.places) if (!used.has(p.slug)) warnings.push(`${where}: place "${p.name}" is in no itinerary`);
}

const show = process.argv.includes("--all") ? Infinity : 40;
if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, show)) console.log(`  - ${w}`);
  if (warnings.length > show) console.log(`  ... and ${warnings.length - show} more (--all shows them)`);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`\nNo problems in ${seenItineraries.size} itineraries.`);

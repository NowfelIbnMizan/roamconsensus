import { toCartItem } from "@/lib/cart-item";
import { getItinerary, getItinerarySlugs } from "@/lib/data";

/**
 * Current data for saved cart lines, keyed by the saved id. Carts keep a snapshot from when an item was added, so
 * price or link fixes made later never reached them. Matches by id, then by name within the same itinerary.
 */
export async function freshCartItems(saved: { id: string; name: string; slug: string }[]) {
  // Only routes that exist are looked up: anyone can post here, and 200 made-up slugs would be 200 database reads.
  const known = new Set((await getItinerarySlugs()).map((r) => r.slug));
  const slugs = [...new Set(saved.map((i) => i.slug))].filter((s) => known.has(s));
  const itineraries = new Map(await Promise.all(slugs.map(async (s) => [s, await getItinerary(s)] as const)));

  const fresh: Record<string, ReturnType<typeof toCartItem>> = {};
  for (const line of saved) {
    const it = itineraries.get(line.slug);
    if (!it) continue;
    const items = it.schedule.flatMap((d) => d.items);
    const match = items.find((i) => i.id === line.id) ?? items.find((i) => i.name === line.name);
    if (match) fresh[line.id] = toCartItem(match, it);
  }
  return fresh;
}

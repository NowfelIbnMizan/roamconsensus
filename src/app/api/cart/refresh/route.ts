import { z } from "zod";
import { toCartItem } from "@/lib/cart-item";
import { getItinerary } from "@/lib/data";

const Body = z.object({
  items: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })).max(200),
});

/**
 * Current data for saved cart lines, keyed by the saved id. Carts keep a snapshot from when an item was added, so
 * price or link fixes made later never reached them. Matches by id, then by name within the same itinerary.
 */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid cart" }, { status: 400 });

  const slugs = [...new Set(parsed.data.items.map((i) => i.slug))];
  const itineraries = new Map(await Promise.all(slugs.map(async (s) => [s, await getItinerary(s)] as const)));

  const fresh: Record<string, ReturnType<typeof toCartItem>> = {};
  for (const saved of parsed.data.items) {
    const it = itineraries.get(saved.slug);
    if (!it) continue;
    const items = it.schedule.flatMap((d) => d.items);
    const match = items.find((i) => i.id === saved.id) ?? items.find((i) => i.name === saved.name);
    if (match) fresh[saved.id] = toCartItem(match, it);
  }
  return Response.json(fresh);
}

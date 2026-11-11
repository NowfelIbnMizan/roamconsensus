import { getDestination, getDestinationSlugs } from "@/lib/data";
import { cachedPhotoUrls } from "@/lib/photos";
import { placePhotoKey } from "@/lib/place";

/** A city's open hotels that creators recommend, for the trip plan's "no hotel yet" picks. Site data only. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("city") ?? "";
  const known = (await getDestinationSlugs()).some((c) => c.slug === slug);
  const city = known ? await getDestination(slug) : null;
  if (!city) return Response.json([], { status: 404 });
  const stays = city.consensus.filter(
    (p) => p.category === "STAY" && !p.closed && p.cartItem && p.creators.length > p.skippedBy.length,
  );
  const cached = await cachedPhotoUrls(stays.filter((p) => !p.photos[0]).map((p) => placePhotoKey(slug, p)));
  return Response.json(
    stays.map((p) => ({
      slug: p.slug,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      creators: p.creators.length,
      photoUrl: p.photos[0] ?? cached.get(placePhotoKey(slug, p)) ?? null,
      cartItem: p.cartItem,
    })),
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}

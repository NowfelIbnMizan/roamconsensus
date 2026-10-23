import { getPlace } from "@/lib/data";
import { placePhotoKey, placeQuery } from "@/lib/place";
import { findGallery, getPhoto } from "@/lib/photos";

/** Extra photos for a place page's gallery. Looked up by place, so callers can't spend the photo quota on anything else. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const p = await getPlace(params.get("d") ?? "", params.get("p") ?? "");
  if (!p) return Response.json([], { status: 404 });
  const key = placePhotoKey(p.destination.slug, p);
  const query = placeQuery(p.name, p.destination.name);
  const main = await getPhoto({ key, query, category: p.category, website: p.website });
  return Response.json(await findGallery(key, query, main.url), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}

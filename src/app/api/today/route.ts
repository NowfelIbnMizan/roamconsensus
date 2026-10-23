import { getDestination } from "@/lib/data";
import { rainyDayPicks } from "@/lib/indoor";
import { placeHref } from "@/lib/place";
import { getWeather } from "@/lib/weather";

/** Trip mode's live extras for one city: the weather and indoor backups for rainy days. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("city") ?? "";
  const d = await getDestination(slug);
  if (!d) return Response.json({ error: "Unknown city" }, { status: 404 });
  const weather = d.center ? await getWeather(d.center.lat, d.center.lng) : null;
  return Response.json({
    weather,
    rainyPicks: rainyDayPicks(d.consensus).map((p) => ({
      name: p.name,
      area: p.area,
      category: p.category,
      href: placeHref(d.slug, p.slug),
      cartItem: p.cartItem,
    })),
  });
}

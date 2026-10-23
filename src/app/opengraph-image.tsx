import { getDestinations } from "@/lib/data";
import { ogCard, ogPhoto, ogSize } from "@/lib/og";

export const alt = "Creatour: see where travel creators agree";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  const cities = (await getDestinations()).filter((d) => !d.isSample);
  const top = [...cities].sort((a, b) => b._count.itineraries - a._count.itineraries).slice(0, 3);
  const trips = cities.reduce((n, d) => n + d._count.itineraries, 0);
  return ogCard({
    eyebrow: "Travel itineraries, compared",
    title: "See where travel creators agree",
    detail: "Real creator routes side by side, with the places they all recommend.",
    photos: await Promise.all(top.map((d) => ogPhoto(`destination:${d.slug}`, d.name))),
    stamp: [`${cities.length} cities`, `${trips} trips`],
  });
}

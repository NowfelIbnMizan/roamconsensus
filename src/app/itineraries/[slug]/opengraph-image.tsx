import { getItinerary, getItinerarySlugs } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { ogCard, ogPhoto, ogSize } from "@/lib/og";

export const alt = "Creator itinerary on Creatour";
export const size = ogSize;
export const contentType = "image/png";

export async function generateStaticParams() {
  return getItinerarySlugs();
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const it = await getItinerary((await params).slug);
  if (!it) return ogCard({ eyebrow: "Itinerary", title: "Not found" });
  return ogCard({
    eyebrow: `${it.destination.name} · ${it.days} days · ${tierLabel[it.tier]}`,
    title: it.title,
    detail: `Day-by-day plan by ${it.creator.name}`,
    photos: [await ogPhoto(`destination:${it.destination.slug}`, it.destination.name)],
  });
}

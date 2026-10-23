import { getDestination, getDestinationSlugs } from "@/lib/data";
import { ogCard, ogSize } from "@/lib/og";

export const alt = "Destination guide from Creatour";
export const size = ogSize;
export const contentType = "image/png";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getDestination((await params).slug);
  if (!d) return ogCard({ eyebrow: "Destination", title: "Not found" });
  const top = d.consensus.filter((p) => p.category === "EXPERIENCE" && p.creators.length > 0).slice(0, 3);
  return ogCard({
    eyebrow: d.country,
    title: `${d.name}: what ${d.creatorCount > 1 ? `${d.creatorCount} travel creators` : "travel creators"} recommend`,
    detail: top.length ? top.map((p) => p.name).join(" · ") : `${d.routes.length} itineraries compared`,
  });
}

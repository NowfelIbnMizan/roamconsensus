import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { CompareRoutes } from "./compare-routes";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/compare">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d ? { title: `Compare ${d.name} itineraries`, description: `${d.name} creator routes side by side.` } : {};
}

export default async function ComparePage({ params }: PageProps<"/destinations/[slug]/compare">) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  if (d.routes.length < 2) return <p className="text-muted">Comparing needs two routes. More are coming soon.</p>;
  const places = Object.fromEntries(d.consensus.map((p) => [p.slug, { name: p.name, category: p.category }]));
  return (
    <>
      <h2 className="text-xl font-semibold">Compare routes side by side</h2>
      <p className="mt-1 text-sm text-muted">Cost, pace and which spots both creators pick.</p>
      <CompareRoutes destination={d.slug} routes={d.routes} places={places} />
    </>
  );
}

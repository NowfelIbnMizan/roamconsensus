import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { CompareRoutes } from "./compare-routes";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/compare">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d
    ? {
        title: `Compare ${d.name} itineraries`,
        description: `Every ${d.name} creator route in one table: days, budget, style and stops. Tick two to see what each one has that the other skips.`,
        ...canonical(`/destinations/${d.slug}/compare`),
      }
    : {};
}

export default async function ComparePage({ params }: PageProps<"/destinations/[slug]/compare">) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  if (d.routes.length < 2) return <p className="text-muted">Only one route here so far. Compare opens when a second creator&apos;s route is added.</p>;
  // Only what each row and its hover card need goes to the browser.
  const places = Object.fromEntries(
    d.consensus.map((p) => [
      p.slug,
      {
        name: p.name,
        category: p.category,
        photo: p.photos[0] ?? null,
        area: p.area,
        fromPrice: p.fromPrice,
        blurb: p.blurb,
        tip: p.tip,
        picks: p.creators.length,
        cartItem: p.cartItem,
      },
    ]),
  );
  return (
    <>
      <h2 className="text-xl font-semibold">Which {d.name} route is for you?</h2>
      <p className="mt-1 text-sm text-muted">Every creator route at a glance. Tick two to see which places they share.</p>
      <CompareRoutes destination={d.slug} routes={d.routes} places={places} creatorCount={d.creatorCount} />
    </>
  );
}

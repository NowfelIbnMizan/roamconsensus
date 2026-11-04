import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { notFound } from "next/navigation";
import { CollectionHeader } from "@/components/collection-header";
import { RouteCollection } from "@/components/route-collection";
import { byDayCost, cityCollections, luxuryRoutes } from "@/lib/collections";
import { getDestination, getDestinationSlugs } from "@/lib/data";

type Props = PageProps<"/destinations/[slug]/luxury">;

export async function generateStaticParams() {
  return getDestinationSlugs();
}

async function load(params: Props["params"]) {
  const d = await getDestination((await params).slug);
  return d && cityCollections(d).luxury ? { d, routes: luxuryRoutes(d).sort(byDayCost) } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load(params);
  if (!page) return {};
  const { d, routes } = page;
  return {
    title: `Luxury ${d.name}: ${routes.length} creator itineraries`,
    description: `${routes.length} luxury ${d.name} itineraries from travel creators, cheapest a day first, with the places they all include and a + to add each stop to your trip.`,
    ...canonical(`/destinations/${d.slug}/luxury`),
  };
}

export default async function LuxuryRoutesPage({ params }: Props) {
  const page = await load(params);
  if (!page) notFound();
  const { d, routes } = page;
  const days = routes.map((r) => r.days);
  const span = Math.min(...days) === Math.max(...days) ? `${days[0]}` : `${Math.min(...days)} to ${Math.max(...days)}`;
  return (
    <>
      <CollectionHeader
        city={d}
        path={`/destinations/${d.slug}/luxury`}
        title={`Luxury ${d.name}`}
        facts={`${routes.length} luxury routes, ${span} days each. Cheapest a day first.`}
      />
      <RouteCollection d={d} routes={routes} />
    </>
  );
}

import type { Metadata } from "next";
import { canonical, clip } from "@/lib/seo";
import { notFound } from "next/navigation";
import { CollectionHeader } from "@/components/collection-header";
import { RouteCollection } from "@/components/route-collection";
import { byDayCost, cityCollections, costSpan, routesOfLength, stopSpan } from "@/lib/collections";
import { getDestination, getDestinations } from "@/lib/data";

type Props = PageProps<"/destinations/[slug]/days/[days]">;

export async function generateStaticParams() {
  const cities = await Promise.all((await getDestinations()).map((c) => getDestination(c.slug)));
  return cities.flatMap((d) => (d ? cityCollections(d).lengths.map((n) => ({ slug: d.slug, days: String(n) })) : []));
}

async function load(params: Props["params"]) {
  const { slug, days } = await params;
  const n = Number(days);
  const d = await getDestination(slug);
  return d && cityCollections(d).lengths.includes(n) ? { d, n, routes: routesOfLength(d, n).sort(byDayCost) } : null;
}

const label = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load(params);
  if (!page) return {};
  const { d, n, routes } = page;
  const cost = costSpan(routes);
  return {
    title: `${label(n)} in ${d.name}: ${routes.length} creator itineraries compared`,
    // Lead with the number people search for; fall back to the plain line when no route is priced enough.
    description: cost
      ? clip(`${label(n)} in ${d.name} costs ${cost.text} per person in the creator itineraries we compare. ${routes.length} routes side by side: cost a day, stops, and the places they all include.`)
      : `${routes.length} ${label(n)} ${d.name} itineraries from travel creators side by side: cost a day, stops, and the places they all include.`,
    ...canonical(`/destinations/${d.slug}/days/${n}`),
  };
}

export default async function DaysPage({ params }: Props) {
  const page = await load(params);
  if (!page) notFound();
  const { d, n, routes } = page;
  const cost = costSpan(routes);
  return (
    <>
      <CollectionHeader
        city={d}
        path={`/destinations/${d.slug}/days/${n}`}
        title={`${label(n)} in ${d.name}`}
        facts={[
          `${routes.length} creator routes of exactly ${label(n)}, with ${stopSpan(routes)}.`,
          cost ? `${cost.text} per person where hotels are priced (${cost.routes} of ${routes.length}).` : "",
          "Cheapest a day first.",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <RouteCollection d={d} routes={routes} />
    </>
  );
}

import type { Metadata } from "next";
import { canonical, clip } from "@/lib/seo";
import { notFound } from "next/navigation";
import { CollectionHeader } from "@/components/collection-header";
import { RouteCollection } from "@/components/route-collection";
import { budgetRoutes, byDayCost, cityCollections, costSpan } from "@/lib/collections";
import { getDestination, getDestinationSlugs } from "@/lib/data";

type Props = PageProps<"/destinations/[slug]/on-a-budget">;

export async function generateStaticParams() {
  return getDestinationSlugs();
}

async function load(params: Props["params"]) {
  const d = await getDestination((await params).slug);
  return d && cityCollections(d).budget ? { d, routes: budgetRoutes(d).sort(byDayCost) } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load(params);
  if (!page) return {};
  const { d, routes } = page;
  const cost = costSpan(routes, true);
  return {
    title: `${d.name} on a budget: ${routes.length} creator itineraries`,
    description: cost
      ? clip(`${d.name} on a budget costs ${cost.text} a day per person in the creator itineraries we compare. ${routes.length} backpacker and budget routes, cheapest a day first, with the places they all include.`)
      : `${routes.length} backpacker and budget ${d.name} itineraries from travel creators, cheapest a day first, with the places they all include.`,
    ...canonical(`/destinations/${d.slug}/on-a-budget`),
  };
}

export default async function BudgetRoutesPage({ params }: Props) {
  const page = await load(params);
  if (!page) notFound();
  const { d, routes } = page;
  const days = routes.map((r) => r.days);
  const cost = costSpan(routes, true);
  const span = Math.min(...days) === Math.max(...days) ? `${days[0]}` : `${Math.min(...days)} to ${Math.max(...days)}`;
  return (
    <>
      <CollectionHeader
        city={d}
        path={`/destinations/${d.slug}/on-a-budget`}
        title={`${d.name} on a budget`}
        facts={[
          `${routes.length} backpacker and budget routes, ${span} days each.`,
          cost ? `${cost.text} a day per person where hotels are priced (${cost.routes} of ${routes.length}).` : "",
          "Cheapest a day first.",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <RouteCollection d={d} routes={routes} />
    </>
  );
}

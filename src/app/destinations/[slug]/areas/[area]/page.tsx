import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionHeader } from "@/components/collection-header";
import { cityCollections, findArea } from "@/lib/collections";
import { getDestination, getDestinations } from "@/lib/data";
import { PlaceList } from "../../(sections)/place-list";

type Props = PageProps<"/destinations/[slug]/areas/[area]">;

export async function generateStaticParams() {
  const cities = await Promise.all((await getDestinations()).map((c) => getDestination(c.slug)));
  return cities.flatMap((d) => (d ? cityCollections(d).areas.map((a) => ({ slug: d.slug, area: a.slug })) : []));
}

async function load(params: Props["params"]) {
  const { slug, area } = await params;
  const d = await getDestination(slug);
  const a = d && findArea(d, area);
  return d && a ? { d, a } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load(params);
  if (!page) return {};
  const { d, a } = page;
  return {
    title: `Things to do in ${a.name}, ${d.name}${a.name.length + d.name.length <= 24 ? ": creator picks" : ""}`,
    description: `${a.places.length} places in ${a.name} that travel creators recommend, sights and food, most-picked first, with prices and a map.`,
    alternates: { canonical: `/destinations/${d.slug}/areas/${a.slug}` },
  };
}

export default async function AreaPage({ params }: Props) {
  const page = await load(params);
  if (!page) notFound();
  const { d, a } = page;
  const food = a.places.filter((p) => p.category === "FOOD").length;
  return (
    <>
      <CollectionHeader
        city={d}
        path={`/destinations/${d.slug}/areas/${a.slug}`}
        title={`Things to do in ${a.name}, ${d.name}`}
        facts={`${a.places.length - food} sights${food ? ` and ${food} places to eat` : ""} that creators picked in ${a.name}.`}
      />
      <PlaceList destination={{ ...d, consensus: a.places }} />
    </>
  );
}

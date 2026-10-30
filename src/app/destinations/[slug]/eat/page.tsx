import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionHeader } from "@/components/collection-header";
import { cityCollections, foodPlaces } from "@/lib/collections";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { PlaceList } from "../(sections)/place-list";

type Props = PageProps<"/destinations/[slug]/eat">;

export async function generateStaticParams() {
  return getDestinationSlugs();
}

async function load(params: Props["params"]) {
  const d = await getDestination((await params).slug);
  return d && cityCollections(d).eat ? { d, places: foodPlaces(d) } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load(params);
  if (!page) return {};
  const { d, places } = page;
  return {
    title: `Where to eat in ${d.name}: ${places.length} spots creators pick`,
    description: `The ${places.length} restaurants, street food stalls and markets travel creators recommend in ${d.name}, most-picked first, with prices and a map.`,
    alternates: { canonical: `/destinations/${d.slug}/eat` },
  };
}

export default async function EatPage({ params }: Props) {
  const page = await load(params);
  if (!page) notFound();
  const { d, places } = page;
  const creators = new Set(places.flatMap((p) => p.creators.map((c) => c.handle))).size;
  const top = places[0];
  return (
    <>
      <CollectionHeader
        city={d}
        path={`/destinations/${d.slug}/eat`}
        title={`Where to eat in ${d.name}`}
        facts={`${places.length} places, picked by ${creators} ${creators === 1 ? "creator" : "creators"}.${
          top.creators.length > 1 ? ` Most picked: ${top.name} (${top.creators.length} creators).` : ""
        }`}
      />
      <PlaceList destination={{ ...d, consensus: places }} />
    </>
  );
}

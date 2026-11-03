import type { Metadata } from "next";
import { CONSENSUS_PREVIEW } from "../(sections)/preview";
import { canonical } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { PageGuide } from "@/components/page-guide";
import { PlaceList } from "../(sections)/place-list";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/places">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d
    ? {
        title: `All ${d.name} places travel creators recommend`,
        description: `Every place travel creators recommend in ${d.name}, most-picked first, on one map, with prices, tips and a + to add each one to your trip.`,
        // When the city page already shows every place, this list repeats it: the city page is the one to index.
        ...canonical(`/destinations/${d.slug}${d.consensus.length > CONSENSUS_PREVIEW ? "/places" : ""}`),
      }
    : {};
}

/** The full list behind the city page's top picks: every place, same map, chips and cards. */
export default async function CityPlacesPage({ params }: PageProps<"/destinations/[slug]/places">) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  return (
    <>
      <Link
        href={`/destinations/${d.slug}#agree`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {d.name}
      </Link>
      <p className="eyebrow mt-3">{d.country}</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        All {d.consensus.length} places in {d.name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {d.creatorCount > 1 ? "Most-picked first. Tap + to add to your trip." : "From one creator so far."}
      </p>
      <PageGuide id="city-places" className="mt-4" />
      <PlaceList destination={d} />
    </>
  );
}

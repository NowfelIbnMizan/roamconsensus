import { notFound } from "next/navigation";
import { CityTabGuide } from "@/components/page-guide";
import { Photo } from "@/components/photo";
import { SampleBanner } from "@/components/sample-banner";
import { getDestination } from "@/lib/data";
import { DestinationTabs, OverviewOnly } from "./tabs";

export default async function DestinationLayout({ children, params }: LayoutProps<"/destinations/[slug]">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();

  return (
    <>
      {destination.isSample && <SampleBanner />}
      <OverviewOnly slug={destination.slug}>
        <div className="mb-6 overflow-hidden rounded-2xl">
          <Photo
            photoKey={`destination:${destination.slug}`}
            query={`${destination.name} ${destination.country}`}
            category="DESTINATION"
            alt={destination.name}
            sizes="(min-width: 1536px) 1536px, 100vw"
            className="aspect-[2/1] sm:aspect-[21/9] lg:aspect-[4/1] 2xl:aspect-[5/1]"
            priority
          />
        </div>
      </OverviewOnly>
      <p className="eyebrow">
        {destination.country} · {destination.routes.length} routes · {destination.creatorCount} creators
      </p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{destination.name}</h1>
      <OverviewOnly slug={destination.slug}>
        <p className="mt-3 max-w-2xl text-muted">{destination.summary}</p>
      </OverviewOnly>
      <DestinationTabs slug={destination.slug} />
      <CityTabGuide slug={destination.slug} />
      {children}
    </>
  );
}

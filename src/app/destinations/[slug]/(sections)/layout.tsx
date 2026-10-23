import { notFound } from "next/navigation";
import { Photo } from "@/components/photo";
import { SampleBanner } from "@/components/sample-banner";
import { getDestination } from "@/lib/data";
import { DestinationTabs } from "./tabs";
import { Stamp } from "@/components/art";

export default async function DestinationLayout({ children, params }: LayoutProps<"/destinations/[slug]">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();

  return (
    <>
      {destination.isSample && <SampleBanner />}
      <div className="polaroid tape relative mb-8 -rotate-[0.6deg] rounded-sm pb-2.5">
        <Photo
          photoKey={`destination:${destination.slug}`}
          query={`${destination.name} ${destination.country}`}
          category="DESTINATION"
          alt={destination.name}
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="aspect-[16/9] rounded-[2px] sm:aspect-[21/9]"
          priority
        />
        <Stamp
          top={destination.country}
          middle={destination.name.length > 9 ? `${destination.routes.length} trips` : destination.name}
          bottom={`${destination.creatorCount} creators`}
          className="absolute -right-2 -bottom-6 size-24 rotate-12 drop-shadow-sm sm:size-28"
        />
      </div>
      <p className="font-hand text-xl text-accent-2">{destination.country}</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{destination.name}</h1>
      <p className="mt-3 max-w-2xl text-muted">{destination.summary}</p>
      <DestinationTabs slug={destination.slug} />
      {children}
    </>
  );
}

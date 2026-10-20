import { notFound } from "next/navigation";
import { Photo } from "@/components/photo";
import { SampleBanner } from "@/components/sample-banner";
import { getDestination } from "@/lib/data";
import { DestinationTabs } from "./tabs";

export default async function DestinationLayout({ children, params }: LayoutProps<"/destinations/[slug]">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();

  return (
    <>
      {destination.isSample && <SampleBanner />}
      <Photo
        photoKey={`destination:${destination.slug}`}
        query={`${destination.name} ${destination.country}`}
        category="DESTINATION"
        alt={destination.name}
        sizes="(min-width: 1024px) 1024px, 100vw"
        className="mb-6 aspect-[21/9] rounded-2xl"
        priority
      />
      <p className="text-sm text-muted">{destination.country}</p>
      <h1 className="text-4xl font-semibold tracking-tight">{destination.name}</h1>
      <p className="mt-3 max-w-2xl text-muted">{destination.summary}</p>
      <DestinationTabs slug={destination.slug} />
      {children}
    </>
  );
}

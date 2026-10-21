import type { MetadataRoute } from "next";
import { getDestinationSlugs, getItinerarySlugs, getPlaceParams } from "@/lib/data";

// Netlify sets URL to the site's main address.
const base = process.env.URL ?? "https://roamconsensus-3arq.netlify.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [destinations, itineraries, places] = await Promise.all([
    getDestinationSlugs(),
    getItinerarySlugs(),
    getPlaceParams(),
  ]);
  return [
    { url: base },
    ...destinations.flatMap((d) =>
      ["", "/when", "/esim"].map((tab) => ({ url: `${base}/destinations/${d.slug}${tab}` })),
    ),
    ...itineraries.map((i) => ({ url: `${base}/itineraries/${i.slug}` })),
    ...places.map((p) => ({ url: `${base}/destinations/${p.slug}/places/${p.place}` })),
  ];
}

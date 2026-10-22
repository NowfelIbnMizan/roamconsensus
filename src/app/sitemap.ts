import type { MetadataRoute } from "next";
import { getCreatorHandles, getDestinationSlugs, getItinerarySlugs, getPlaceParams } from "@/lib/data";

// Netlify sets URL to the site's main address.
const base = process.env.URL ?? "https://roamconsensus-3arq.netlify.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [destinations, itineraries, places, creators] = await Promise.all([
    getDestinationSlugs(),
    getItinerarySlugs(),
    getPlaceParams(),
    getCreatorHandles(),
  ]);
  return [
    { url: base },
    { url: `${base}/visa` },
    { url: `${base}/about` },
    { url: `${base}/creators` },
    { url: `${base}/itineraries` },
    ...creators.map((c) => ({ url: `${base}/creators/${c.handle}` })),
    ...destinations.flatMap((d) =>
      ["", "/best", "/when", "/before", "/budget", "/esim"].map((tab) => ({ url: `${base}/destinations/${d.slug}${tab}` })),
    ),
    ...itineraries.map((i) => ({ url: `${base}/itineraries/${i.slug}` })),
    ...places.map((p) => ({ url: `${base}/destinations/${p.slug}/places/${p.place}` })),
  ];
}

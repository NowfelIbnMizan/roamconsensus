import { getCreatorHandles, getDestinationSlugs, getItinerarySlugs, getPlaceParams, getPosts } from "@/lib/data";

/** City tabs that are worth indexing (Compare is interactive, so left out). */
export const DESTINATION_TABS = ["", "/best", "/when", "/before", "/budget", "/esim"];

export const destinationPaths = (slug: string) => DESTINATION_TABS.map((tab) => `/destinations/${slug}${tab}`);

/** Every public page, as site-relative paths: the sitemap and "tell Bing about everything" both use it. */
export async function sitePaths() {
  const [destinations, itineraries, places, creators, posts] = await Promise.all([
    getDestinationSlugs(),
    getItinerarySlugs(),
    getPlaceParams(),
    getCreatorHandles(),
    getPosts(),
  ]);
  return [
    "/",
    "/visa",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/disclosure",
    "/creators",
    "/itineraries",
    "/blog",
    ...posts.map((p) => `/blog/${p.slug}`),
    ...creators.map((c) => `/creators/${c.handle}`),
    ...destinations.flatMap((d) => destinationPaths(d.slug)),
    ...itineraries.map((i) => `/itineraries/${i.slug}`),
    ...places.map((p) => `/destinations/${p.slug}/places/${p.place}`),
  ];
}

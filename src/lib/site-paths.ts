import { collectionPaths } from "@/lib/collections";
import { countryHref, getCountries } from "@/lib/countries";
import { CONSENSUS_PREVIEW } from "@/app/destinations/[slug]/(sections)/preview";
import { getCreatorHandles, getDestination, getDestinationSlugs, getItineraryDates, getPlaceParams, getPosts } from "@/lib/data";

/** City tabs that are worth indexing. */
export const DESTINATION_TABS = ["", "/best", "/stay", "/when", "/before", "/budget", "/esim", "/compare"];

export const destinationPaths = (slug: string) => DESTINATION_TABS.map((tab) => `/destinations/${slug}${tab}`);

type Entry = { path: string; lastModified?: string };

const latest = (dates: (string | undefined)[]) => dates.filter((d) => d !== undefined).sort().at(-1);

/**
 * Every public page with the date it last changed, where the database knows one: a city's pages follow the city and
 * its routes, a route and a blog post follow themselves, a country follows its cities. Pages with no date of their
 * own (places, creators, the fixed pages) carry none rather than a guessed one.
 */
export async function siteEntries(): Promise<Entry[]> {
  const [destinations, itineraries, places, creators, posts] = await Promise.all([
    getDestinationSlugs(),
    getItineraryDates(),
    getPlaceParams(),
    getCreatorHandles(),
    getPosts(),
  ]);
  const [cities, countries] = await Promise.all([
    Promise.all(destinations.map((d) => getDestination(d.slug))),
    getCountries(),
  ]);
  const cityDate = new Map(cities.flatMap((d) => (d ? [[d.slug, d.updatedAt] as const] : [])));
  const fixed = [
    "/visa",
    "/split-travel-costs",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/disclosure",
    "/creators",
    "/quiz",
  ];
  const newest = latest([...cityDate.values()]);
  return [
    { path: "/", lastModified: newest },
    ...fixed.map((path) => ({ path })),
    { path: "/itineraries", lastModified: latest(itineraries.map((i) => i.updatedAt)) },
    { path: "/blog", lastModified: latest(posts.map((p) => p.updatedAt)) },
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, lastModified: p.updatedAt })),
    ...creators.map((c) => ({ path: `/creators/${c.handle}` })),
    ...countries.map((c) => ({
      path: countryHref(c.name),
      lastModified: latest(c.cities.map((city) => cityDate.get(city.slug))),
    })),
    ...destinations.flatMap((d) =>
      destinationPaths(d.slug).map((path) => ({ path, lastModified: cityDate.get(d.slug) })),
    ),
    // A city with no more places than its own page shows never links to the full list, so it isn't listed.
    ...cities.flatMap((d) =>
      d && d.consensus.length > CONSENSUS_PREVIEW
        ? [{ path: `/destinations/${d.slug}/places`, lastModified: d.updatedAt }]
        : [],
    ),
    ...cities.flatMap((d) => (d ? collectionPaths(d).map((path) => ({ path, lastModified: d.updatedAt })) : [])),
    ...itineraries.map((i) => ({ path: `/itineraries/${i.slug}`, lastModified: i.updatedAt })),
    ...places.map((p) => ({ path: `/destinations/${p.slug}/places/${p.place}` })),
  ];
}

/** Every public page, as site-relative paths: "tell Bing about everything" uses it. */
export async function sitePaths() {
  return (await siteEntries()).map((e) => e.path);
}

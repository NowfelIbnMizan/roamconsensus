import { getDestination, getDestinations } from "@/lib/data";
import { areaSlug, MIN_ROUTES } from "@/lib/collections";

/** A country page needs routes from two cities or more; with one city it would repeat that city's page. */
const MIN_CITIES = 2;

export const countrySlug = areaSlug;
export const countryHref = (country: string) => `/countries/${countrySlug(country)}`;

/** Countries with their own page: name, slug and the cities in it that have routes, most routes first. */
export async function getCountries() {
  const all = await getDestinations();
  const byCountry = new Map<string, typeof all>();
  for (const d of all)
    if (!d.isSample && d._count.itineraries > 0) byCountry.set(d.country, [...(byCountry.get(d.country) ?? []), d]);
  return [...byCountry]
    .map(([name, cities]) => ({
      name,
      slug: countrySlug(name),
      cities: cities.sort((a, b) => b._count.itineraries - a._count.itineraries),
      routes: cities.reduce((n, c) => n + c._count.itineraries, 0),
    }))
    .filter((c) => c.cities.length >= MIN_CITIES && c.routes >= MIN_ROUTES)
    .sort((a, b) => b.routes - a.routes);
}

/** One country page's data: each city with its full routes. */
export async function getCountry(slug: string) {
  const country = (await getCountries()).find((c) => c.slug === slug);
  if (!country) return null;
  const cities = (await Promise.all(country.cities.map((c) => getDestination(c.slug)))).filter((d) => d !== null);
  return { name: country.name, slug: country.slug, cities };
}

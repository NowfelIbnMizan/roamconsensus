import Link from "next/link";
import { countryHref, getCountries } from "@/lib/countries";
import { getDestinations } from "@/lib/data";
import { liveVersus, versusHref } from "@/lib/versus";

const pill =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-strong bg-card px-3 py-1 text-sm font-medium hover:border-accent hover:text-accent pointer-coarse:min-h-11 pointer-coarse:px-3.5";

/**
 * Under a city's routes, for the visitor who hasn't settled on it: the city-vs-city pages it is in and, when one
 * creator is all the city has, better-covered cities in the same country.
 */
export async function CityNext({ d }: { d: { slug: string; name: string; country: string; creatorCount: number } }) {
  const cities = await getDestinations();
  const name = new Map(cities.map((c) => [c.slug, c.name]));
  const pairs = liveVersus(cities).filter(([a, b]) => a === d.slug || b === d.slug);
  const mine = cities.find((c) => c.slug === d.slug)?._count.itineraries ?? 0;
  const nearby =
    d.creatorCount <= 1
      ? cities
          .filter((c) => c.country === d.country && c.slug !== d.slug && c._count.itineraries >= mine)
          .sort((a, b) => b._count.itineraries - a._count.itineraries)
          .slice(0, 4)
      : [];
  if (!pairs.length && !nearby.length) return null;
  // A country page only exists once the country has enough cities.
  const countryPage = (await getCountries()).some((c) => c.name === d.country);
  return (
    <div className="mt-4 space-y-2">
      {nearby.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted">
          <span>
            One creator covers {d.name} so far. More routes in{" "}
            {countryPage ? (
              <Link href={countryHref(d.country)} className="font-medium text-foreground underline hover:text-accent">
                {d.country}
              </Link>
            ) : (
              d.country
            )}
            :
          </span>
          {nearby.map((c) => (
            <Link key={c.slug} href={`/destinations/${c.slug}`} className={`${pill} text-foreground`}>
              {c.name}
              <span className="text-xs font-normal text-muted tabular-nums">
                {c._count.itineraries}
                <span className="sr-only"> {c._count.itineraries === 1 ? "route" : "routes"}</span>
              </span>
            </Link>
          ))}
        </p>
      )}
      {pairs.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted">
          Still choosing?
          {pairs.map(([a, b]) => (
            <Link key={`${a}-${b}`} href={versusHref(a, b)} className={`${pill} text-foreground`}>
              {name.get(a)} or {name.get(b)}?
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}

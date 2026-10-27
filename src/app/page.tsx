import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { Photo } from "@/components/photo";
import {
  getDestination,
  getDestinationCenters,
  getDestinations,
  getSiteStats,
} from "@/lib/data";
import { CreatorAvatar } from "@/components/creator-avatar";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";
import { HomeSearch } from "@/components/home-search";
import { CityMap } from "@/components/city-map";

// Shown while the grid has room, so a single live destination doesn't sit alone. Drop one once it goes live.
const comingSoon = [
  { slug: "tokyo", name: "Tokyo", country: "Japan" },
  { slug: "bangkok", name: "Bangkok", country: "Thailand" },
];

export default async function Home() {
  const [destinations, stats, centers] = await Promise.all([
    getDestinations(),
    getSiteStats(),
    getDestinationCenters(),
  ]);
  const { creators } = stats;
  // Letter circles look like a placeholder, so the faces row waits until a few creators have agreed to a photo.
  const faces = creators.filter((c) => c.avatarUrl);
  const routes = destinations.reduce((n, d) => n + d._count.itineraries, 0);
  const live = new Set(destinations.map((d) => d.slug));
  const placeholders = comingSoon
    .filter((c) => !live.has(c.slug))
    .slice(0, Math.max(0, 3 - destinations.length));
  // Show the idea, not just tell it: the most-shared spot in the three best-covered cities.
  const covered = [...destinations]
    .sort((a, b) => b._count.itineraries - a._count.itineraries)
    .slice(0, 3);
  const examples = (
    await Promise.all(covered.map((d) => getDestination(d.slug)))
  )
    .map((d) => {
      const top = d?.consensus.find(
        (p) => p.creators.length >= 2 && p.skippedBy.length === 0,
      );
      return d && top
        ? { city: d.name, slug: d.slug, place: top, of: d.creatorCount }
        : null;
    })
    .filter((e) => e !== null);

  return (
    <>
      <section className="grid items-center gap-6 pb-6 md:grid-cols-[1fr_1.1fr] md:gap-10 md:py-8">
        <div>
          <Link
            href="/creators"
            className="inline-flex items-center gap-2.5 hover:text-foreground"
          >
            {faces.length >= 3 && (
              <span className="flex -space-x-2" aria-hidden>
                {faces.slice(0, 6).map((c) => (
                  <CreatorAvatar
                    key={c.handle}
                    creator={c}
                    size="sm"
                    className="ring-2 ring-background"
                  />
                ))}
              </span>
            )}
            <span className="eyebrow">
              {destinations.length} cities · {routes} routes · {creators.length}{" "}
              creators
            </span>
          </Link>
          <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Where are you going?
          </h1>
          <p className="mt-3 max-w-md text-muted">
            Tap a city or search. See the places travel creators{" "}
            <em className="font-medium text-accent">don&apos;t miss</em>, then build
            your trip around them.
          </p>
          <HomeSearch
            cities={destinations.map(({ slug, name, country }) => ({
              slug,
              name,
              country,
            }))}
          />
          <Link
            href="/quiz"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            <Sparkles className="size-3.5" aria-hidden /> Not sure where? Find
            your match
          </Link>
          <p className="fine-print mt-2">
            Trips collected from what independent creators share publicly
            online.
          </p>
        </div>
        <CityMap
          cities={destinations.flatMap((d) =>
            centers[d.slug]
              ? [
                  {
                    slug: d.slug,
                    name: d.name,
                    routes: d._count.itineraries,
                    ...centers[d.slug],
                  },
                ]
              : [],
          )}
        />
      </section>

      <section id="destinations" className="mt-4 scroll-mt-6">
        <h2 className="text-3xl font-semibold">Where to next?</h2>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 2xl:grid-cols-4">
          {destinations.map((d) => (
            <li key={d.slug}>
              <Link href={`/destinations/${d.slug}`} className="group block">
                <span className="block overflow-hidden rounded-2xl">
                  <Photo
                    photoKey={`destination:${d.slug}`}
                    query={`${d.name} ${d.country}`}
                    category="DESTINATION"
                    alt={d.name}
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    credit={false}
                    className="aspect-[4/3] transition duration-500 group-hover:scale-[1.03]"
                  />
                </span>
                <div className="pt-2.5 sm:pt-3">
                  <div className="eyebrow">{d.country}</div>
                  <h3 className="mt-0.5 font-display text-xl font-semibold group-hover:text-accent sm:text-2xl">
                    {d.name}
                    {d.isSample && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        Sample
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 hidden text-sm text-muted sm:line-clamp-2">
                    {d.summary}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted sm:mt-2">
                    {d._count.itineraries} routes{" "}
                    <ArrowRight
                      className="size-4 transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {placeholders.map((c) => (
            <li key={c.slug} aria-label={`${c.name}, coming soon`}>
              <div className="overflow-hidden rounded-2xl border border-dashed border-line bg-card">
                <Photo
                  photoKey={`destination:${c.slug}`}
                  query={`${c.name} ${c.country}`}
                  category="DESTINATION"
                  alt=""
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="aspect-[16/9] opacity-60 grayscale"
                />
                <div className="p-5">
                  <div className="flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-4" aria-hidden /> {c.country}
                  </div>
                  <h3 className="mt-1 text-xl font-semibold text-muted">
                    {c.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    Collecting creator routes now.
                  </p>
                  <p className="mt-4 flex items-center gap-1 text-sm font-medium text-muted">
                    <Clock className="size-4" aria-hidden /> Coming soon
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {examples.length > 0 && (
        <section aria-labelledby="agree-examples" className="mt-16">
          <h2 id="agree-examples" className="text-2xl font-semibold">
            Places creators don&apos;t miss
          </h2>
          <ul className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {examples.map((e) => (
              <li key={e.slug} className="w-64 shrink-0 snap-start sm:w-auto">
                <Link
                  href={placeHref(e.slug, e.place.slug)}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl"
                >
                  <Photo
                    photoKey={placePhotoKey(e.slug, e.place)}
                    query={placeQuery(e.place.name, e.city)}
                    category={e.place.category}
                    website={e.place.website}
                    alt=""
                    sizes="(min-width: 640px) 33vw, 256px"
                    credit={false}
                    className="size-full transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                    <span className="flex items-center gap-1 text-xs text-white/85">
                      <MapPin className="size-3.5" aria-hidden /> {e.city}
                    </span>
                    <span className="mt-0.5 block font-display text-lg font-semibold leading-snug">
                      {e.place.name}
                    </span>
                    <span className="mt-1 block text-xs text-white/85">
                      {e.place.creators.length} of {e.of} creators recommend it
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

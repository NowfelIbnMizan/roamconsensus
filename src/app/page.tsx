import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { Photo } from "@/components/photo";
import { getDestination, getDestinations, getSiteStats } from "@/lib/data";
import { CreatorAvatar } from "@/components/creator-avatar";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";
import { HomeSearch } from "@/components/home-search";

// Shown while the grid has room, so a single live destination doesn't sit alone. Drop one once it goes live.
const comingSoon = [
  { slug: "tokyo", name: "Tokyo", country: "Japan" },
  { slug: "bangkok", name: "Bangkok", country: "Thailand" },
];

export default async function Home() {
  const [destinations, stats] = await Promise.all([
    getDestinations(),
    getSiteStats(),
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
      <section className="relative grid items-center gap-8 pb-6 md:grid-cols-[1.4fr_1fr] md:py-10">
        <div>
          <Link
            href="/creators"
            className="mb-3 inline-flex items-center gap-2.5 text-xs text-muted hover:text-foreground sm:mb-4 sm:text-sm"
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
            <span>
              Trips from{" "}
              <strong className="text-foreground">
                {creators.length} independent travel creators
              </strong>
              <span className="fine-print mt-1 block">
                Collected from what they share publicly online.
              </span>
            </span>
          </Link>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Plan your trip from the routes travel creators{" "}
            <em className="font-medium text-accent">agree</em> on.
          </h1>
          <p className="mt-4 hidden max-w-xl text-muted sm:block">
            Pick a city and how long you have. You get day-by-day creator
            routes, the spots they all recommend, and a trip cart to book from.
          </p>
          <HomeSearch
            cities={destinations.map(({ slug, name, country }) => ({
              slug,
              name,
              country,
            }))}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Popular:</span>
            {covered
              .concat(
                destinations.filter((d) => !covered.includes(d)).slice(0, 3),
              )
              .map((d) => (
                <Link
                  key={d.slug}
                  href={`/destinations/${d.slug}`}
                  className="rounded-full border border-line bg-card px-3 py-1 hover:border-accent"
                >
                  {d.name}
                </Link>
              ))}
            <Link
              href="/quiz"
              className="inline-flex items-center gap-1 px-1 font-medium text-accent hover:underline"
            >
              <Sparkles className="size-3.5" aria-hidden /> Not sure where? 3
              quick questions
            </Link>
          </div>
        </div>
        <div className="hidden md:block">
          {/* One tall photo and two stacked: the three best-covered cities. */}
          <div className="grid aspect-[5/4] grid-cols-[1.25fr_1fr] grid-rows-2 gap-2.5">
            {covered.map((d, i) => (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className={`group relative block overflow-hidden rounded-2xl ${i === 0 ? "row-span-2" : ""}`}
              >
                <Photo
                  photoKey={`destination:${d.slug}`}
                  query={`${d.name} ${d.country}`}
                  category="DESTINATION"
                  alt={d.name}
                  sizes="(min-width: 768px) 280px, 40vw"
                  credit={false}
                  priority={i === 0}
                  className="size-full transition duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent to-45%" />
                <span className="absolute bottom-3 left-3.5 font-display text-lg font-medium text-white">
                  {d.name}
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-muted tabular-nums">
            {destinations.length} cities · {routes} routes · {creators.length}{" "}
            creators
          </p>
        </div>
      </section>

      <section id="destinations" className="mt-4 scroll-mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-3xl font-semibold">Where to next?</h2>
          <p className="text-sm text-muted tabular-nums">
            {destinations.length} cities · {routes} creator routes
          </p>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3">
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
                    Collecting creator itineraries now.
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
            For example, creators agree on…
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

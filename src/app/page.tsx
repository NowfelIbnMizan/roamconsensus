import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { Photo } from "@/components/photo";
import { getDestination, getDestinations, getSiteStats } from "@/lib/data";
import { CreatorAvatar } from "@/components/creator-avatar";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";
import { JourneyDoodle, SquiggleDivider, Stamp, Swoosh } from "@/components/art";

// Shown while the grid has room, so a single live destination doesn't sit alone. Drop one once it goes live.
const comingSoon = [
  { slug: "tokyo", name: "Tokyo", country: "Japan" },
  { slug: "bangkok", name: "Bangkok", country: "Thailand" },
];

export default async function Home() {
  const [destinations, stats] = await Promise.all([getDestinations(), getSiteStats()]);
  const { creators } = stats;
  const routes = destinations.reduce((n, d) => n + d._count.itineraries, 0);
  const live = new Set(destinations.map((d) => d.slug));
  const placeholders = comingSoon.filter((c) => !live.has(c.slug)).slice(0, Math.max(0, 3 - destinations.length));
  // Show the idea, not just tell it: the most-shared spot in the three best-covered cities.
  const covered = [...destinations].sort((a, b) => b._count.itineraries - a._count.itineraries).slice(0, 3);
  const examples = (await Promise.all(covered.map((d) => getDestination(d.slug))))
    .map((d) => {
      const top = d?.consensus.find((p) => p.creators.length >= 2 && p.skippedBy.length === 0);
      return d && top ? { city: d.name, slug: d.slug, place: top, of: d.creatorCount } : null;
    })
    .filter((e) => e !== null);

  return (
    <>
      <section className="relative grid items-center gap-8 py-6 md:grid-cols-[1.15fr_1fr] md:py-10">
        <div>
          <Link
            href="/creators"
            className="mb-4 inline-flex items-center gap-2.5 text-sm text-muted hover:text-foreground"
          >
            <span className="flex -space-x-2" aria-hidden>
              {creators.slice(0, 6).map((c) => (
                <CreatorAvatar key={c.handle} creator={c} size="sm" className="ring-2 ring-background" />
              ))}
            </span>
            <span>
              Trips from <strong className="text-foreground">{creators.length} travel creators</strong>
            </span>
          </Link>
          <p className="font-hand text-2xl text-accent-2 -rotate-2">your trip, crowd-checked by creators ✈</p>
          <h1 className="mt-1 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
            See where travel creators{" "}
            <span className="relative inline-block">
              agree
              <Swoosh className="absolute -bottom-2 left-0 h-3 w-full" />
            </span>
            .
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Real creator itineraries, lined up city by city. See the spots they all pick, then build your trip.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
            >
              <Sparkles className="size-4" aria-hidden /> Find my trip in 3 questions
            </Link>
            <Link
              href="/itineraries"
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-medium hover:border-accent sm:px-5"
            >
              Trips by length and budget
            </Link>
            <Link
              href="#destinations"
              className="hidden items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:border-accent sm:inline-flex"
            >
              Browse destinations
            </Link>
          </div>
        </div>
        <div className="relative pt-4 pb-24 md:pb-28">
          <JourneyDoodle className="absolute inset-0 m-auto w-full text-foreground/25" />
          {/* A fanned row: neighbours overlap only at the edges, so every caption stays readable. */}
          <div className="relative flex justify-center">
            {covered.map((d, i) => (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className={`polaroid tape block w-[36%] rounded-sm ${i % 2 ? "tape-alt mt-0" : "mt-8"} ${i ? "-ml-[3%]" : ""}`}
                style={{ rotate: `${[-6, 2, 6][i]}deg`, zIndex: i === 1 ? 2 : 1 }}
              >
                <Photo
                  photoKey={`destination:${d.slug}`}
                  query={`${d.name} ${d.country}`}
                  category="DESTINATION"
                  alt={d.name}
                  sizes="(min-width: 768px) 200px, 36vw"
                  credit={false}
                  priority={i === 0}
                  className="aspect-[4/5] rounded-[2px]"
                />
                <span className="block truncate px-1 py-1 text-center font-hand text-lg sm:text-xl">{d.name}</span>
              </Link>
            ))}
          </div>
          <Stamp
            top={`${destinations.length} cities`}
            middle={`${routes} trips`}
            bottom={`${creators.length} creators`}
            className="absolute right-2 bottom-0 z-10 size-20 rotate-12 sm:size-24"
          />
        </div>
      </section>
      <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { n: stats.cities, label: "cities covered" },
          { n: stats.trips, label: "creator itineraries" },
          { n: stats.places, label: "places recommended" },
          { n: stats.stops, label: "stops compared" },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-card px-4 py-3">
            <dt className="sr-only">{t.label}</dt>
            <dd className="font-display text-3xl font-semibold tabular-nums">{t.n.toLocaleString("en")}</dd>
            <dd className="text-sm text-muted">{t.label}</dd>
          </div>
        ))}
      </dl>
      {examples.length > 0 && (
        <section aria-labelledby="agree-examples" className="mt-6">
          <h2 id="agree-examples" className="font-hand text-2xl text-accent-2">
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
                    <span className="mt-0.5 block font-display text-lg font-semibold leading-snug">{e.place.name}</span>
                    <span className="mt-0.5 block font-hand text-lg leading-tight text-[#ffd98a]">
                      {e.place.creators.length} of {e.of} creators recommend it
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <SquiggleDivider className="mt-6" />

      <section id="destinations" className="mt-8 scroll-mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-3xl font-semibold">Where to next?</h2>
          <p className="font-hand text-xl text-muted">pick a page from the journal ↓</p>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3">
          {destinations.map((d, i) => (
            <li key={d.slug}>
              <Link
                href={`/destinations/${d.slug}`}
                className={`polaroid tape group block rounded-sm ${i % 2 ? "tape-alt" : ""}`}
                style={{ rotate: `${[-1.5, 1, -0.5, 1.5, -1, 0.5][i % 6]}deg` }}
              >
                <Photo
                  photoKey={`destination:${d.slug}`}
                  query={`${d.name} ${d.country}`}
                  category="DESTINATION"
                  alt={d.name}
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="aspect-[4/3] rounded-[2px]"
                />
                <div className="px-1 pt-2 pb-3 sm:px-2 sm:pt-3 sm:pb-4">
                  <div className="flex items-center gap-1 text-xs text-muted sm:text-sm">
                    <MapPin className="size-3.5 sm:size-4" aria-hidden /> {d.country}
                  </div>
                  <h3 className="mt-0.5 font-display text-xl font-semibold sm:text-2xl">
                    {d.name}
                    {d.isSample && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        Sample
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 hidden text-sm text-muted sm:line-clamp-2">{d.summary}</p>
                  <p className="mt-1 flex items-center gap-1 font-hand text-lg text-accent sm:mt-3 sm:text-xl">
                    {d._count.itineraries} itineraries{" "}
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
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
                  <h3 className="mt-1 text-xl font-semibold text-muted">{c.name}</h3>
                  <p className="mt-2 text-sm text-muted">Collecting creator itineraries now.</p>
                  <p className="mt-4 flex items-center gap-1 text-sm font-medium text-muted">
                    <Clock className="size-4" aria-hidden /> Coming soon
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

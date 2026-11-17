import Link from "next/link";
import { ArrowRight, CalendarDays, ListChecks, MapPin, Route, Sparkles } from "lucide-react";
import { BeenCity } from "@/components/been-city";
import { CreatorChip } from "@/components/creator";
import { Money } from "@/components/money";
import { Photo } from "@/components/photo";
import { Thumb } from "@/components/thumb";
import type { getDestination, getDestinations, QuizData } from "@/lib/data";
import { mostlyPriced, tierLabel } from "@/lib/format";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";

type Destinations = Awaited<ReturnType<typeof getDestinations>>;
type City = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
type StarterRoute = QuizData["routes"][number];

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** What a first-time visitor needs to hear before trusting a free planner. */
export function TrustLine({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted ${className}`}>
      {["Free", "No sign-up to plan", "Every route links to its creator"].map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Cities as small pills with their route count; one swipeable row on phones when `scroll` is set. */
export function CityPills({ cities, label, scroll = false }: { cities: Destinations; label: string; scroll?: boolean }) {
  if (!cities.length) return null;
  return (
    <ul
      aria-label={label}
      className={`mt-3 flex items-center gap-1.5 ${scroll ? "-mx-4 overflow-x-auto px-4 whitespace-nowrap [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" : "flex-wrap"}`}
    >
      <li className="mr-1 shrink-0 text-sm text-muted" aria-hidden>
        {label}
      </li>
      {cities.map((d) => (
        <li key={d.slug} className="shrink-0">
          <Link
            href={`/destinations/${d.slug}`}
            // `relative` keeps the screen-reader text inside the swipe row; without it the page scrolls sideways.
            className="relative inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-card px-3.5 py-1.5 text-sm font-medium hover:border-accent hover:text-accent sm:min-h-9 sm:px-3"
          >
            {d.name}
            <span className="text-xs font-normal text-muted tabular-nums">
              {d._count.itineraries}
              <span className="sr-only"> {d._count.itineraries === 1 ? "route" : "routes"}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The first tap: the best-covered cities as photo tiles, so nobody has to type to start. */
export function CityTiles({ cities }: { cities: Destinations }) {
  return (
    <ul id="destinations" className="mt-6 grid scroll-mt-6 grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-6">
      {cities.map((d, n) => (
        <BeenCity key={d.slug} slug={d.slug}>
          <Link href={`/destinations/${d.slug}`} className="group relative block overflow-hidden rounded-2xl">
            <Photo
              photoKey={`destination:${d.slug}`}
              query={`${d.name} ${d.country}`}
              category="DESTINATION"
              alt={d.name}
              sizes="(min-width: 1024px) 16vw, 33vw"
              credit={false}
              priority={n < 3}
              className="aspect-square transition duration-500 group-hover:scale-[1.04] lg:aspect-[3/4]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-2.5 text-white sm:p-4">
              <span className="block font-display text-base font-semibold leading-tight sm:text-2xl">{d.name}</span>
              <span className="mt-0.5 block text-xs text-white/85 sm:text-sm">
                {count(d._count.itineraries, "route", "routes")}
              </span>
            </span>
          </Link>
        </BeenCity>
      ))}
    </ul>
  );
}

/**
 * One full, mostly priced route from each of the best-covered cities: the routes a newcomer can open and trust the
 * total of. Sights-only routes and ones with no hotel price are left for the finder.
 */
export function pickStarters(cities: Destinations, routes: StarterRoute[], max = 4): StarterRoute[] {
  return cities
    .flatMap((d) =>
      routes
        .filter(
          (r) =>
            r.destination.slug === d.slug &&
            !r.sightsOnly &&
            !r.noStay &&
            r.totalCents > 0 &&
            mostlyPriced(r) &&
            r.days >= 3,
        )
        // Closest to a five-day trip, then the cheaper one.
        .sort((a, b) => Math.abs(a.days - 5) - Math.abs(b.days - 5) || a.totalCents - b.totalCents)
        .slice(0, 1),
    )
    .slice(0, max);
}

/** Ready routes: the page's shortest path to "open a route, add it to your trip". */
export function StarterRoutes({ routes, total }: { routes: StarterRoute[]; total: number }) {
  if (!routes.length) return null;
  return (
    <section aria-labelledby="starter-routes" className="mt-12">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="starter-routes" className="text-2xl font-semibold sm:text-3xl">
          Start from a ready route
        </h2>
        <Link
          href="/itineraries"
          className="-my-3 inline-flex shrink-0 items-center gap-1 py-3 text-sm font-medium text-accent hover:underline"
        >
          All {total} routes <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="-mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {routes.map((r) => (
          <li key={r.slug} className="w-[17rem] shrink-0 snap-start lg:w-auto">
            {/* The title link stretches over the whole card. */}
            <article className="polaroid h-full">
              <div className="relative">
                <Thumb
                  url={r.photoUrl}
                  category="EXPERIENCE"
                  alt={r.title}
                  sizes="(min-width: 1024px) 25vw, 272px"
                  className="aspect-[16/10] w-full"
                />
                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <MapPin className="size-3" aria-hidden /> {r.destination.name}
                </span>
              </div>
              <div className="p-4">
                <p className="eyebrow">
                  {count(r.days, "day", "days")} · {tierLabel[r.tier]}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                  <Link href={`/itineraries/${r.slug}`} className="after:absolute after:inset-0 hover:text-accent">
                    {r.title}
                  </Link>
                </h3>
                <div className="mt-2">
                  <CreatorChip creator={r.creator} link={false} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-2 border-t border-line pt-3">
                  <p>
                    <span className="text-lg font-semibold tabular-nums">
                      <Money cents={r.totalCents} />
                    </span>
                    <span className="block text-xs text-muted">est. per person</span>
                    <span className="block text-xs text-muted">
                      {r.scope.priced} of {count(r.scope.stops, "stop", "stops")} priced
                    </span>
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium whitespace-nowrap text-accent">
                    See plan <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The idea shown, not told: one city's most-shared places, each with its count as dots. */
export function AgreeStrip({ city }: { city: City }) {
  const picks = city.consensus
    .filter((p) => p.creators.length >= 2 && p.skippedBy.length === 0 && p.category !== "STAY")
    .slice(0, 4);
  if (city.creatorCount < 3 || picks.length < 3) return null;
  return (
    <section aria-labelledby="agree-examples" className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            Example · {city.name} · {count(city.routes.length, "route", "routes")}
          </p>
          <h2 id="agree-examples" className="mt-1 text-2xl font-semibold sm:text-3xl">
            Places creators don&apos;t miss
          </h2>
        </div>
        <Link
          href={`/destinations/${city.slug}/best`}
          className="-my-3 inline-flex shrink-0 items-center gap-1 py-3 text-sm font-medium text-accent hover:underline"
        >
          {city.name} top picks <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
        {picks.map((p) => (
          <li key={p.slug} className="w-56 shrink-0 snap-start sm:w-auto">
            <Link
              href={placeHref(city.slug, p.slug)}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl"
            >
              <Photo
                photoKey={placePhotoKey(city.slug, p)}
                query={placeQuery(p.name, city.name)}
                category={p.category}
                website={p.website}
                alt={p.name}
                sizes="(min-width: 640px) 25vw, 224px"
                credit={false}
                className="size-full transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                <span className="block font-display text-lg font-semibold leading-snug">{p.name}</span>
                <span className="mt-1.5 flex items-center gap-2 text-xs text-white/90">
                  <span className="flex items-center gap-1" aria-hidden>
                    {Array.from({ length: city.creatorCount }, (_, k) => (
                      <span
                        key={k}
                        className={`size-2 rounded-full ${k < p.creators.length ? "bg-white" : "bg-white/30"}`}
                      />
                    ))}
                  </span>
                  {p.creators.length} of {city.creatorCount} creators
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: Route, title: "Pick a route", text: "Day-by-day plans travel creators shared, side by side." },
    { icon: ListChecks, title: "Make it yours", text: "Add the whole route or single stops. Drop what you don't want." },
    { icon: CalendarDays, title: "Take it with you", text: "Map, budget and calendar export, saved on your phone." },
  ];
  return (
    <section aria-labelledby="how-it-works" className="mt-12 rounded-3xl border border-line bg-card p-5 sm:p-8">
      <h2 id="how-it-works" className="text-2xl font-semibold sm:text-3xl">
        How it works
      </h2>
      <ol className="mt-5 grid gap-5 sm:grid-cols-3 sm:gap-8">
        {steps.map((s, n) => (
          <li key={s.title} className="flex gap-3 sm:block">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <s.icon className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold sm:mt-3">
                <span className="text-muted tabular-nums">{n + 1}.</span> {s.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** For the visitor who scrolled the whole page and hasn't chosen: the quiz, then every route. */
export function ClosingBand({ routes }: { routes: number }) {
  return (
    <section className="mt-14 rounded-3xl bg-foreground px-5 py-8 text-background sm:px-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">Not sure where to go?</h2>
          <p className="mt-2 max-w-md text-background/75">
            Tap how long, your budget and what you love. Your best-fit route shows up as you go.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 font-semibold text-foreground hover:opacity-90"
          >
            <Sparkles className="size-4" aria-hidden /> Find your match
          </Link>
          <Link
            href="/itineraries"
            className="inline-flex items-center gap-1 px-2 py-3 font-medium underline-offset-4 hover:underline"
          >
            Browse all {routes} routes <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

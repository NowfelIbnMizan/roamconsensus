import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { Photo } from "@/components/photo";
import { getCreatorHandles, getDestinations } from "@/lib/data";
import { JourneyDoodle, SquiggleDivider, Stamp, Swoosh } from "@/components/art";

// Shown while the grid has room, so a single live destination doesn't sit alone. Drop one once it goes live.
const comingSoon = [
  { slug: "tokyo", name: "Tokyo", country: "Japan" },
  { slug: "bangkok", name: "Bangkok", country: "Thailand" },
];

export default async function Home() {
  const [destinations, creators] = await Promise.all([getDestinations(), getCreatorHandles()]);
  const routes = destinations.reduce((n, d) => n + d._count.itineraries, 0);
  const live = new Set(destinations.map((d) => d.slug));
  const placeholders = comingSoon.filter((c) => !live.has(c.slug)).slice(0, Math.max(0, 3 - destinations.length));

  return (
    <>
      <section className="relative grid items-center gap-8 py-6 md:grid-cols-[1.15fr_1fr] md:py-10">
        <div>
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
            We line up itineraries from multiple creators for one destination, show what they all recommend, and let you
            compare budget, mid-range and luxury routes side by side.
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
        <div className="relative hidden md:block">
          <JourneyDoodle className="w-full text-foreground/70" />
          <Stamp
            top={`${destinations.length} cities`}
            middle={`${routes} trips`}
            bottom={`${creators.length} creators`}
            className="absolute -top-2 right-4 size-28 rotate-12"
          />
        </div>
      </section>
      <div className="flex items-center gap-4 md:hidden">
        <Stamp
          top={`${destinations.length} cities`}
          middle={`${routes} trips`}
          bottom={`${creators.length} creators`}
          className="size-20 shrink-0 -rotate-6"
        />
        <JourneyDoodle className="h-20 flex-1 text-foreground/70" />
      </div>
      <SquiggleDivider className="mt-4 md:mt-6" />

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

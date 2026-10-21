import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { Photo } from "@/components/photo";
import { getDestinations } from "@/lib/data";

// Shown while the grid has room, so a single live destination doesn't sit alone. Drop one once it goes live.
const comingSoon = [
  { slug: "tokyo", name: "Tokyo", country: "Japan" },
  { slug: "bangkok", name: "Bangkok", country: "Thailand" },
];

export default async function Home() {
  const destinations = await getDestinations();
  const live = new Set(destinations.map((d) => d.slug));
  const placeholders = comingSoon.filter((c) => !live.has(c.slug)).slice(0, Math.max(0, 3 - destinations.length));

  return (
    <>
      <section className="py-10">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          See where travel creators agree.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          We line up itineraries from multiple creators for one destination, show what they all recommend, and let you
          compare budget, mid-range and luxury routes side by side.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            <Sparkles className="size-4" aria-hidden /> Find my trip in 3 questions
          </Link>
          <Link
            href="#destinations"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:border-accent"
          >
            Browse destinations
          </Link>
        </div>
      </section>

      <section id="destinations" className="mt-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Destinations</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/destinations/${d.slug}`}
                className="group block overflow-hidden rounded-2xl border border-line bg-card transition hover:border-accent"
              >
                <Photo
                  photoKey={`destination:${d.slug}`}
                  query={`${d.name} ${d.country}`}
                  category="DESTINATION"
                  alt={d.name}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-[16/9]"
                />
                <div className="p-5">
                  <div className="flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-4" aria-hidden /> {d.country}
                  </div>
                  <h3 className="mt-1 text-xl font-semibold">
                    {d.name}
                    {d.isSample && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        Sample
                      </span>
                    )}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{d.summary}</p>
                  <p className="mt-4 flex items-center gap-1 text-sm font-medium text-accent">
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
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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

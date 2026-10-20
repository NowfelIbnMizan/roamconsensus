import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { getDestinations } from "@/lib/data";

export default async function Home() {
  const destinations = await getDestinations();

  return (
    <>
      <section className="py-10">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          See where travel creators agree.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          We line up itineraries from multiple creators for one destination, show what they all recommend, and let
          you compare budget, mid-range and luxury routes side by side.
        </p>
      </section>

      <section id="destinations" className="mt-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Destinations</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/destinations/${d.slug}`}
                className="group block rounded-2xl border border-line bg-card p-5 transition hover:border-accent"
              >
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
                  {d._count.itineraries} itineraries <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

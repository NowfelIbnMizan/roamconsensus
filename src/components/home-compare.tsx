import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CreatorChip } from "@/components/creator";
import { Money } from "@/components/money";
import type { getDestination } from "@/lib/data";
import { mostlyPriced } from "@/lib/format";
import { placeHref } from "@/lib/place";

type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
type Route = Destination["routes"][number];

export type Comparison = {
  city: Destination;
  a: Route;
  b: Route;
  shared: { slug: string; name: string }[];
  onlyA: { slug: string; name: string }[];
  onlyB: { slug: string; name: string }[];
};

/**
 * Two routes by different creators in one city with the most stops in common: the pair that shows the idea best.
 * Hotels and transfers are left out of the overlap, since "both stayed somewhere" says nothing.
 */
export function pickComparison(cities: Destination[]): Comparison | null {
  let best: (Comparison & { score: number }) | null = null;
  for (const city of cities) {
    const places = new Map(city.consensus.map((p) => [p.slug, p]));
    const sights = (r: Route) =>
      r.places.filter((s) => {
        const c = places.get(s)?.category;
        return c === "EXPERIENCE" || c === "FOOD";
      });
    for (const [n, a] of city.routes.entries())
      for (const b of city.routes.slice(n + 1)) {
        if (a.creator.handle === b.creator.handle) continue;
        const inA = new Set(sights(a));
        const inB = new Set(sights(b));
        const named = (slugs: string[]) =>
          slugs.flatMap((s) => (places.has(s) ? [{ slug: s, name: places.get(s)!.name }] : []));
        const shared = named([...inA].filter((s) => inB.has(s)));
        // More shared stops wins; similar lengths break ties, so it reads as a fair match.
        // A week against three weeks isn't a fair match, so it only wins when nothing closer shares enough.
        const uneven = Math.max(a.days, b.days) > 2 * Math.min(a.days, b.days) ? 1000 : 0;
        const score = shared.length * 10 - Math.abs(a.days - b.days) - uneven;
        if (shared.length >= 2 && (!best || score > best.score))
          best = {
            score,
            city,
            a,
            b,
            shared,
            onlyA: named([...inA].filter((s) => !inB.has(s))),
            onlyB: named([...inB].filter((s) => !inA.has(s))),
          };
      }
  }
  return best;
}

function RouteSide({
  r,
  only,
  city,
}: {
  r: Route;
  only: { slug: string; name: string }[];
  city: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-background p-3 sm:p-4">
      <CreatorChip creator={r.creator} />
      <Link href={`/itineraries/${r.slug}`} className="mt-2 line-clamp-2 block font-semibold leading-snug hover:text-accent">
        {r.title}
      </Link>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Length</dt>
          <dd className="tabular-nums">
            {r.days} {r.days === 1 ? "day" : "days"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Stops</dt>
          <dd className="tabular-nums">{r.scope.stops}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Priced</dt>
          <dd className="tabular-nums">
            {r.scope.priced} of {r.scope.stops}
          </dd>
        </div>
        {r.totalCents > 0 && mostlyPriced(r) && !r.sightsOnly && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Est. cost</dt>
            <dd className="font-medium tabular-nums">
              <Money cents={r.totalCents} />
            </dd>
          </div>
        )}
      </dl>
      {only.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-xs font-medium">
            Only in this route: {only.length} {only.length === 1 ? "pick" : "picks"}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-muted">
            {only.slice(0, 3).map((p) => (
              <li key={p.slug} className="truncate">
                <Link href={placeHref(city, p.slug)} className="hover:text-accent hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** The home page's proof: two real routes side by side, what they share and what only one has. */
export function HomeCompare({ c }: { c: Comparison }) {
  const { city } = c;
  return (
    <section aria-labelledby="compare-demo" className="mt-4 rounded-3xl border border-line bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <p className="eyebrow">Live comparison · {city.name}</p>
          <h2 id="compare-demo" className="mt-1 text-2xl font-semibold tracking-tight">
            Two creators, one city: where they agree
          </h2>
        </div>
        <Link
          href={`/destinations/${city.slug}/compare`}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          Compare all {city.routes.length} {city.name} routes <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] md:gap-4">
        <RouteSide r={c.a} only={c.onlyA} city={city.slug} />
        <div className="order-last col-span-2 rounded-2xl bg-accent-soft/60 p-3 sm:p-4 md:order-none md:col-span-1">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-semibold text-accent tabular-nums">{c.shared.length}</span>
            <span className="font-medium">{c.shared.length === 1 ? "stop" : "stops"} in both routes</span>
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {c.shared.slice(0, 6).map((p) => (
              <li key={p.slug}>
                <Link
                  href={placeHref(city.slug, p.slug)}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-xs hover:border-accent"
                >
                  <Check className="size-3 text-accent" aria-hidden /> {p.name}
                </Link>
              </li>
            ))}
            {c.shared.length > 6 && (
              <li className="px-1 py-1 text-xs text-muted">+ {c.shared.length - 6} more</li>
            )}
          </ul>
          <p className="fine-print mt-3">
            Shared picks are a signal, not a guarantee. The rest of each route is what makes it different.
          </p>
        </div>
        <RouteSide r={c.b} only={c.onlyB} city={city.slug} />
      </div>
    </section>
  );
}

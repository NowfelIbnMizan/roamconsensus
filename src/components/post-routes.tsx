"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CreatorChip } from "@/components/creator";
import { useMoney } from "@/components/money";
import { Thumb } from "@/components/thumb";
import type { getDestination } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { placeHref } from "@/lib/place";

type Route = NonNullable<Awaited<ReturnType<typeof getDestination>>>["routes"][number];
/** Place names by slug; transport legs are left out, they aren't places to compare. */
type Places = Record<string, string>;

const perDay = (r: Route) => (r.totalCents ? Math.round(r.totalCents / r.days) : null);

function useDayPrice() {
  const { money } = useMoney();
  // Same caveats as the Compare tab: a total without hotel or food isn't a trip cost.
  return (r: Route) =>
    r.sightsOnly
      ? "Sights only, no hotel or food"
      : r.noStay && perDay(r)
        ? `${money(perDay(r)!)}/day, no hotel price`
        : perDay(r)
          ? `${money(perDay(r)!)}/day`
          : "Price not listed";
}

/** The route a post is about: what it is, who made it, what it costs, and a way in. */
export function RouteCard({ route }: { route: Route }) {
  const dayPrice = useDayPrice();
  return (
    <article className="relative flex gap-4 rounded-2xl border border-line bg-card p-4 hover:border-accent">
      <Thumb url={route.photos[0]} category="EXPERIENCE" sizes="112px" className="size-24 rounded-xl sm:size-28" />
      <div className="min-w-0 flex-1">
        <p className="eyebrow">
          {tierLabel[route.tier]} · {route.days} {route.days === 1 ? "day" : "days"} · {route.stops} stops
        </p>
        <h2 className="mt-1 font-semibold">
          <Link href={`/itineraries/${route.slug}`} className="after:absolute after:inset-0">
            {route.title}
          </Link>
        </h2>
        <div className="relative z-10 mt-1.5">
          <CreatorChip creator={route.creator} />
        </div>
        <p className="mt-1.5 text-sm text-muted">{dayPrice(route)}</p>
      </div>
      <ArrowRight className="size-5 shrink-0 self-center text-accent" aria-hidden />
    </article>
  );
}

function PlaceList({ title, slugs, places, destination }: { title: string; slugs: string[]; places: Places; destination: string }) {
  return (
    <div>
      <p className="text-sm font-medium">
        {title} · {slugs.length}
      </p>
      {slugs.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {slugs.map((s) => (
            <li key={s}>
              <Link
                href={placeHref(destination, s)}
                className="inline-block rounded-full border border-line bg-card px-2.5 py-0.5 text-sm hover:border-accent"
              >
                {places[s] ?? s}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">None.</p>
      )}
    </div>
  );
}

/** Two routes as a table, then the places they share and the ones only one of them has. */
export function SideBySide({ a, b, places, destination }: { a: Route; b: Route; places: Places; destination: string }) {
  const dayPrice = useDayPrice();
  const own = (r: Route) => r.places.filter((p) => p in places);
  const both = own(a).filter((p) => b.places.includes(p));
  const rows: [string, (r: Route) => string][] = [
    ["Style", (r) => tierLabel[r.tier]],
    ["Days", (r) => String(r.days)],
    ["Cost", dayPrice],
    ["Stops", (r) => String(r.stops)],
  ];
  return (
    <section className="space-y-5">
      <div className="grid gap-3">
        <RouteCard route={a} />
        <RouteCard route={b} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="p-3 font-medium text-muted">
                <span className="sr-only">Compared</span>
              </th>
              <th className="p-3 font-medium">{a.creator.name}</th>
              <th className="p-3 font-medium">{b.creator.name}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row" className="p-3 text-left font-normal text-muted">
                  {label}
                </th>
                <td className="p-3">{value(a)}</td>
                <td className="p-3">{value(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-4 rounded-2xl border border-line p-4">
        <PlaceList title="Both include" slugs={both} places={places} destination={destination} />
        <PlaceList
          title={`Only ${a.creator.name}`}
          slugs={own(a).filter((p) => !both.includes(p))}
          places={places}
          destination={destination}
        />
        <PlaceList
          title={`Only ${b.creator.name}`}
          slugs={own(b).filter((p) => !both.includes(p))}
          places={places}
          destination={destination}
        />
      </div>
    </section>
  );
}

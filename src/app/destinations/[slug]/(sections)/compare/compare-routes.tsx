"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { AllocationBar } from "@/components/allocation-bar";
import { CreatorChip } from "@/components/creator";
import { useMoney } from "@/components/money";
import { Thumb } from "@/components/thumb";
import type { getDestination } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { placeHref } from "@/lib/place";
import type { ItemCategory } from "@/generated/prisma/enums";

type Route = NonNullable<Awaited<ReturnType<typeof getDestination>>>["routes"][number];
type Places = Record<string, { name: string; category: ItemCategory; photo: string | null }>;

const perDay = (r: Route) => (r.totalCents ? Math.round(r.totalCents / r.days) : null);
// Sights-only routes have no hotel or food in their total, so "cheapest" ranks them after full routes.
const cheapKey = (r: Route) => (r.sightsOnly ? 1e12 : 0) + (perDay(r) ?? 1e11);

const SORTS = {
  agreed: "Most shared",
  cheap: "Cheapest a day",
  short: "Shortest",
} as const;
type Sort = keyof typeof SORTS;

/** Every route in one table; tick two to see which places they share. */
export function CompareRoutes({
  destination,
  routes,
  places,
}: {
  destination: string;
  routes: Route[];
  places: Places;
}) {
  const { money } = useMoney();
  const [sort, setSort] = useState<Sort>("agreed");
  const [ticked, setTicked] = useState([routes[0].slug, routes[1].slug]);

  // How many of a route's spots at least one other route also picks.
  const agreed = new Map(
    routes.map((r) => [r.slug, r.places.filter((p) => routes.some((x) => x !== r && x.places.includes(p))).length]),
  );
  const key = (r: Route) =>
    sort === "agreed" ? -agreed.get(r.slug)! : sort === "cheap" ? cheapKey(r) : r.days;
  const rows = [...routes].sort((x, y) => key(x) - key(y));
  // Ticking a third route drops the oldest pick, so two stay compared.
  const toggle = (slug: string) =>
    setTicked(ticked.includes(slug) ? ticked.filter((t) => t !== slug) : [...ticked, slug].slice(-2));

  const pair = ticked.map((slug) => routes.find((r) => r.slug === slug)!);
  const [a, b] = pair;
  const both = b ? a.places.filter((p) => b.places.includes(p)) : [];
  const groups = b
    ? [
        { title: `Both include · ${both.length}`, slugs: both, empty: "These two routes share no places.", shared: true },
        ...[a, b].map((r, n) => {
          const other = n ? a : b;
          const slugs = r.places.filter((p) => !other.places.includes(p));
          return { title: `Only ${r.creator.name} · ${slugs.length}`, slugs, empty: "Every place here is on both routes.", shared: false };
        }),
      ]
    : [];

  const price = (r: Route) => (r.sightsOnly ? "Sights only" : perDay(r) ? money(perDay(r)!) : "Not listed");
  const dayPrice = (r: Route) =>
    r.sightsOnly
      ? "sights only, no hotel or food"
      : perDay(r)
        ? `${money(perDay(r)!)}/day`
        : "price not listed";
  const missing = (r: Route) =>
    r.unpricedCount > 0 && perDay(r) && !r.sightsOnly ? <span className="block text-xs text-muted">{r.unpricedCount} not priced</span> : null;

  const Tick = ({ r }: { r: Route }) => {
    const on = ticked.includes(r.slug);
    return (
      <button
        type="button"
        aria-pressed={on}
        aria-label={`Compare ${r.title}`}
        onClick={() => toggle(r.slug)}
        className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${
          on ? "border-accent bg-accent text-background" : "border-line-strong bg-card hover:border-accent"
        }`}
      >
        {on && <Check className="size-4" aria-hidden />}
      </button>
    );
  };

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Sort</span>
        {(Object.keys(SORTS) as Sort[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={sort === k}
            onClick={() => setSort(k)}
            className={`rounded-full border px-3 py-1 text-sm ${
              sort === k ? "border-accent bg-accent-soft font-medium" : "border-line bg-card hover:border-accent"
            }`}
          >
            {SORTS[k]}
          </button>
        ))}
        <span className="w-full text-sm text-muted sm:ml-auto sm:w-auto">Tick two to compare</span>
      </div>

      <div className="mt-3 hidden overflow-hidden rounded-2xl border border-line bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="w-12 p-3">
                <span className="sr-only">Compare</span>
              </th>
              <th className="p-3 font-medium">Route</th>
              <th className="p-3 font-medium">Style</th>
              <th className="p-3 font-medium">Days</th>
              <th className="p-3 font-medium">Per day</th>
              <th className="p-3 font-medium">Stops</th>
              <th className="p-3 font-medium">Shared with other routes</th>
              <th className="w-48 p-3 font-medium">Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.slug} className={ticked.includes(r.slug) ? "bg-accent-soft/40" : ""}>
                <td className="p-3">
                  <Tick r={r} />
                </td>
                <td className="p-3">
                  <Link href={`/itineraries/${r.slug}`} className="font-medium hover:text-accent hover:underline">
                    {r.title}
                  </Link>
                  <div className="mt-1">
                    <CreatorChip creator={r.creator} />
                  </div>
                </td>
                <td className="p-3">{tierLabel[r.tier]}</td>
                <td className="p-3 tabular-nums">{r.days}</td>
                <td className="p-3 tabular-nums">
                  {price(r)}
                  {missing(r)}
                </td>
                <td className="p-3 tabular-nums">{r.stops}</td>
                <td className="p-3 tabular-nums">
                  {agreed.get(r.slug)} of {r.places.length}
                </td>
                <td className="p-3">
                  {r.totalCents ? <AllocationBar allocation={r.allocation} legend={false} /> : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-3 space-y-2 md:hidden">
        {rows.map((r) => (
          <li
            key={r.slug}
            className={`flex gap-3 rounded-2xl border p-3 ${
              ticked.includes(r.slug) ? "border-accent bg-accent-soft/40" : "border-line bg-card"
            }`}
          >
            <Tick r={r} />
            <div className="min-w-0 flex-1">
              <Link href={`/itineraries/${r.slug}`} className="font-medium">
                {r.title}
              </Link>
              <div className="mt-1">
                <CreatorChip creator={r.creator} />
              </div>
              <p className="mt-1 text-xs text-muted">
                {tierLabel[r.tier]} · {r.days} {r.days === 1 ? "day" : "days"} · {dayPrice(r)} ·{" "}
                {agreed.get(r.slug)} agreed spots
              </p>
            </div>
          </li>
        ))}
      </ul>

      {b ? (
        <div className="mt-6 grid items-start gap-4 md:grid-cols-3">
          {groups.map((g) => (
            <section
              key={g.title}
              className={`rounded-2xl border p-4 ${g.shared ? "border-accent bg-accent-soft/40" : "border-line bg-card"}`}
            >
              <h3 className="font-semibold">{g.title}</h3>
              {g.shared && <p className="text-xs text-muted">Safe bets: two creators picked them.</p>}
              {g.slugs.length ? (
                <ul className="mt-2 grid gap-1">
                  {g.slugs.map((s) => (
                    <li key={s}>
                      <Link
                        href={placeHref(destination, s)}
                        className="group flex items-center gap-2 rounded-xl p-1 hover:bg-accent-soft"
                      >
                        <Thumb
                          url={places[s]?.photo}
                          alt={places[s]?.name ?? s}
                          category={places[s]?.category ?? "EXPERIENCE"}
                          className="size-10 rounded-lg"
                          sizes="40px"
                        />
                        <span className="min-w-0 text-sm leading-tight group-hover:text-accent">
                          {places[s]?.name ?? s}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">{g.empty}</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-line bg-card p-4 text-sm text-muted">
          Tick {2 - pair.length} more route{pair.length ? "" : "s"} to see which places they share.
        </p>
      )}
    </div>
  );
}

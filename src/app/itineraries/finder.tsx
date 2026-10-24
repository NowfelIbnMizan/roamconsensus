"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, SlidersHorizontal } from "lucide-react";
import { addDays, rangeLabel } from "@/components/date-range";
import { CreatorChip } from "@/components/creator";
import { useMoney } from "@/components/money";
import type { QuizData } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { LENGTHS } from "@/lib/trip-lengths";
import { VIBES, type VibeKey } from "@/lib/vibes";
import type { Tier } from "@/generated/prisma/enums";

const TIERS: Tier[] = ["BACKPACKER", "BUDGET", "MIDRANGE", "LUXURY"];
const SORTS = {
  cheap: "Cheapest",
  short: "Shortest",
  long: "Longest",
} as const;
const VIBE_SHARE = 0.15;

/** Every creator route, filtered by trip length, budget, style and destination. Filtering runs in the browser. */
export function TripFinder({ routes }: { routes: QuizData["routes"] }) {
  const { money, code, fromLocal } = useMoney();
  const [length, setLength] = useState(0);
  const [budget, setBudget] = useState("");
  const [tier, setTier] = useState<Tier | "">("");
  const [where, setWhere] = useState<string[]>([]);
  const [trip, setTrip] = useState<{
    days: number;
    start: string | null;
  } | null>(null);
  const [sort, setSort] = useState<keyof typeof SORTS>("cheap");
  const [vibes, setVibes] = useState<VibeKey[]>([]);

  // The home page search links here with ?where=bali,bangkok&days=12&start=2026-11-03 (or an older ?length=).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const w = q.get("where")?.split(",").filter(Boolean) ?? [];
    const days = Number(q.get("days"));
    const l = Number(q.get("length"));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after mount on a static page
    if (w.length) setWhere(w);
    if (days > 0) {
      setTrip({ days, start: q.get("start") });
      // -1: the "fits my trip" filter, routes up to a day longer than each city's share of the days.
      setLength(-1);
    } else if (l > 0 && l < LENGTHS.length) setLength(l);
  }, []);

  const destinations = useMemo(
    () =>
      [
        ...new Map(
          routes.map((r) => [r.destination.slug, r.destination]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    [routes],
  );

  const maxCents = budget ? fromLocal(Number(budget)) : null;
  // Each city gets an even share of the trip's days. A route one day longer still fits: a day is easy to trim.
  const fitDays = trip
    ? Math.max(1, Math.round(trip.days / Math.max(1, where.length)))
    : null;
  const { min, max } =
    length === -1 && fitDays
      ? { min: 1, max: fitDays + 1 }
      : (LENGTHS[length] ?? LENGTHS[0]);
  const shown = routes
    .filter((r) => r.days >= min && r.days <= max)
    .filter((r) => !tier || r.tier === tier)
    .filter((r) => !where.length || where.includes(r.destination.slug))
    // A route fits a vibe when at least 15% of its stops match it; with several picked, any one will do.
    .filter(
      (r) =>
        !vibes.length || vibes.some((v) => (r.vibes[v] ?? 0) >= VIBE_SHARE),
    )
    // Routes with no prices, or unpriced hotels, can't be judged against a budget, so a budget hides them.
    .filter(
      (r) =>
        maxCents === null ||
        (r.totalCents > 0 && r.unpricedStays === 0 && r.totalCents <= maxCents),
    )
    .sort((a, b) =>
      sort === "short"
        ? a.days - b.days
        : sort === "long"
          ? b.days - a.days
          : (a.totalCents || Infinity) - (b.totalCents || Infinity),
    );

  const card = (r: (typeof routes)[number]) => (
    <li key={r.slug}>
      <article className="relative flex h-full flex-col rounded-2xl border border-line bg-card p-4 transition hover:border-accent has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium uppercase tracking-wide text-accent">
            {r.destination.name}
          </span>
          <span className="text-muted">
            {length === -1 && fitDays && r.days > fitDays && (
              <span className="mr-1.5 rounded-full bg-line px-1.5 py-0.5">
                1 day over
              </span>
            )}
            {r.days} {r.days === 1 ? "day" : "days"} · {tierLabel[r.tier]}
          </span>
        </div>
        <h2 className="mt-1 font-semibold">
          <Link
            href={`/itineraries/${r.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {r.title}
          </Link>
        </h2>
        <div className="relative z-10 mt-2 flex flex-wrap items-center gap-1.5 self-start text-sm text-muted">
          by <CreatorChip creator={r.creator} />
        </div>
        {VIBES.some((v) => (r.vibes[v.key] ?? 0) >= VIBE_SHARE) && (
          <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {VIBES.filter((v) => (r.vibes[v.key] ?? 0) >= VIBE_SHARE).map(
              (v) => (
                <span
                  key={v.key}
                  className={`rounded-full px-2 py-0.5 ${vibes.includes(v.key) ? "bg-accent-soft font-medium text-accent" : "bg-line text-muted"}`}
                >
                  {v.emoji} {v.label}
                </span>
              ),
            )}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-3">
          <p>
            {r.totalCents > 0 ? (
              <>
                <span className="text-xl font-semibold tabular-nums">
                  {money(r.totalCents)}
                </span>
                <span className="text-xs text-muted">
                  {" "}
                  est. per person
                  {r.unpricedCount > 0 && ` + ${r.unpricedCount} unpriced`}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted">Prices not listed</span>
            )}
          </p>
          <ArrowRight className="size-4 text-accent" aria-hidden />
        </div>
      </article>
    </li>
  );

  const chip = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition ${
      on
        ? "bg-foreground font-medium text-background"
        : "border border-line bg-card text-muted hover:text-foreground"
    }`;

  const names = where.map(
    (w) => destinations.find((d) => d.slug === w)?.name ?? w,
  );
  const perCity = where.length > 1 ? fitDays : null;

  return (
    <div className="mt-6">
      {(trip || where.length > 1) && (
        <div className="mb-4 flex gap-3 rounded-2xl bg-accent-soft p-4 text-sm">
          <CalendarDays
            className="mt-0.5 size-5 shrink-0 text-accent"
            aria-hidden
          />
          <p>
            <strong>
              {names.join(" + ") || "Your trip"}
              {trip && ` · ${trip.days} days`}
              {trip?.start &&
                ` (${rangeLabel(trip.start, addDays(trip.start, trip.days - 1))})`}
            </strong>
            <br />
            {where.length > 1
              ? `${perCity ? `About ${perCity} days in each. ` : ""}Pick one route per city and add each to your trip: the trip planner puts them back to back.`
              : "Showing routes that fit your trip. Add one to your trip and the planner lays it out day by day."}
          </p>
        </div>
      )}
      <div className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div>
          <p className="mb-2 text-sm font-medium">Trip length</p>
          <div className="flex flex-wrap gap-2">
            {fitDays && (
              <button
                type="button"
                className={chip(length === -1)}
                aria-pressed={length === -1}
                onClick={() => setLength(-1)}
              >
                Fits {fitDays} days{where.length > 1 ? " per city" : ""}
              </button>
            )}
            {LENGTHS.map((l, i) => (
              <button
                key={l.label}
                type="button"
                className={chip(length === i)}
                aria-pressed={length === i}
                onClick={() => setLength(i)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">
            Where?{" "}
            <span className="font-normal text-muted">
              Pick more than one to combine cities
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={chip(!where.length)}
              aria-pressed={!where.length}
              onClick={() => setWhere([])}
            >
              Anywhere
            </button>
            {destinations.map((d) => {
              const on = where.includes(d.slug);
              return (
                <button
                  key={d.slug}
                  type="button"
                  className={chip(on)}
                  aria-pressed={on}
                  onClick={() =>
                    setWhere(
                      on
                        ? where.filter((x) => x !== d.slug)
                        : [...where, d.slug],
                    )
                  }
                >
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">What kind of trip?</p>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => {
              const on = vibes.includes(v.key);
              return (
                <button
                  key={v.key}
                  type="button"
                  className={chip(on)}
                  aria-pressed={on}
                  onClick={() =>
                    setVibes(
                      on ? vibes.filter((x) => x !== v.key) : [...vibes, v.key],
                    )
                  }
                >
                  <span aria-hidden>{v.emoji}</span> {v.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Max budget per person ({code})</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Any"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Budget style</span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier | "")}
              className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
            >
              <option value="">Any budget</option>
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {tierLabel[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          {shown.length} {shown.length === 1 ? "trip" : "trips"}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted">
          <SlidersHorizontal className="size-4" aria-hidden />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
            className="rounded-lg border border-line bg-card px-2 py-1"
            aria-label="Sort trips"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center text-muted">
          No trips match. Try fewer trip types, a longer length or a bigger
          budget.
        </p>
      ) : where.length > 1 ? (
        // Several cities: one list each, so the traveller picks a route per city.
        where.map((slug) => {
          const inCity = shown.filter((r) => r.destination.slug === slug);
          const name = destinations.find((d) => d.slug === slug)?.name ?? slug;
          return (
            <section key={slug} className="mt-6">
              <h2 className="font-display text-xl font-semibold">
                {name}{" "}
                <span className="text-sm font-normal text-muted">
                  · {inCity.length} {inCity.length === 1 ? "route" : "routes"}
                </span>
              </h2>
              {inCity.length ? (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {inCity.map(card)}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  No {name} routes match. Try another trip length.
                </p>
              )}
            </section>
          );
        })
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">{shown.map(card)}</ul>
      )}
      <p className="mt-4 text-xs text-muted">
        Budgets are the creators&apos; listed prices for stays, activities and
        transport. Flights not included.
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { StopDetails } from "@/components/stop-details";
import { addDays, rangeLabel } from "@/components/date-range";
import { CreatorChip } from "@/components/creator";
import { Thumb } from "@/components/thumb";
import { useMoney } from "@/components/money";
import type { QuizData } from "@/lib/data";
import { mostlyPriced, tierLabel } from "@/lib/format";
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
export function TripFinder({
  routes,
  guide,
}: {
  routes: QuizData["routes"];
  /** The "How this works" note, shown under the heading. */
  guide?: React.ReactNode;
}) {
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
    // Routes with few prices, or unpriced hotels, can't be judged against a budget, so a budget hides them.
    .filter(
      (r) =>
        maxCents === null ||
        (mostlyPriced(r) &&
          r.unpricedStays === 0 &&
          r.totalCents > 0 &&
          r.totalCents <= maxCents),
    )
    .sort((a, b) =>
      sort === "short"
        ? a.days - b.days
        : sort === "long"
          ? b.days - a.days
          : // Partly priced routes look cheap only because their prices are missing, so they go last.
            Number(!mostlyPriced(a)) - Number(!mostlyPriced(b)) ||
            (a.totalCents || Infinity) - (b.totalCents || Infinity),
    );

  // One row per route with the numbers lined up, so routes compare at a glance.
  const row = (r: (typeof routes)[number]) => (
    <li
      key={r.slug}
      className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-3 transition hover:bg-line/30 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent sm:grid-cols-[minmax(0,1fr)_4.5rem_7rem_8rem] sm:px-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Thumb
          url={r.photoUrl}
          category="EXPERIENCE"
          sizes="64px"
          className="size-14 shrink-0 rounded-lg sm:size-16"
        />
        <div className="min-w-0">
          {where.length === 0 && (
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              {r.destination.name}
            </p>
          )}
          <h2 className="line-clamp-2 font-medium sm:truncate">
            <Link
              href={`/itineraries/${r.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {r.title}
            </Link>
          </h2>
          <div className="relative z-10 flex min-w-0 items-center gap-1.5 text-sm whitespace-nowrap text-muted">
            <CreatorChip creator={r.creator} />
            <span className="hidden truncate sm:inline">
              {VIBES.filter((v) => (r.vibes[v.key] ?? 0) >= VIBE_SHARE).map(
                (v) => (
                  <span key={v.key} title={v.label} aria-label={v.label}>
                    {v.emoji}
                  </span>
                ),
              )}
            </span>
          </div>
          <p className="text-xs text-muted sm:hidden">
            {r.days} {r.days === 1 ? "day" : "days"} · {tierLabel[r.tier]} ·{" "}
            {r.stops} stops
            {length === -1 && fitDays && r.days > fitDays && " · 1 day over"}
          </p>
        </div>
      </div>
      <span className="hidden tabular-nums sm:block">
        {r.days}
        {length === -1 && fitDays && r.days > fitDays && (
          <span className="block text-xs text-muted">1 day over</span>
        )}
      </span>
      <span className="hidden text-sm text-muted sm:block">
        {tierLabel[r.tier]}
      </span>
      <span className="text-right">
        {r.totalCents > 0 && mostlyPriced(r) ? (
          <>
            <span className="block text-lg font-semibold tabular-nums">
              {money(r.totalCents)}
            </span>
            {r.unpricedCount > 0 && (
              <span className="block text-xs text-muted">
                + {r.unpricedCount} unpriced
              </span>
            )}
          </>
        ) : (
          <span className="block max-w-24 text-xs text-muted">
            {r.totalCents > 0 ? "Partly priced" : "Prices not listed"}
          </span>
        )}
      </span>
    </li>
  );

  const list = (rs: typeof routes) => (
    <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-card">
      <div className="hidden grid-cols-[minmax(0,1fr)_4.5rem_7rem_8rem] gap-4 border-b border-line px-4 py-2 text-xs text-muted sm:grid">
        <span>Route</span>
        <span>Days</span>
        <span>Style</span>
        <span className="text-right">Est. per person</span>
      </div>
      <ul className="divide-y divide-line">{rs.map(row)}</ul>
    </div>
  );

  const chip = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition ${
      on
        ? "bg-foreground font-medium text-background"
        : "border border-line bg-card text-muted hover:text-foreground"
    }`;
  const pill = (on: boolean) =>
    `inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-sm transition ${
      on
        ? "bg-foreground font-medium text-background"
        : "border border-line bg-card hover:border-accent"
    }`;

  const names = where.map(
    (w) => destinations.find((d) => d.slug === w)?.name ?? w,
  );
  const perCity = where.length > 1 ? fitDays : null;
  const lengthLabel =
    length === -1 && fitDays
      ? `Fits ${fitDays} days${where.length > 1 ? " per city" : ""}`
      : LENGTHS[length].label;
  const budgetLabel = budget
    ? `Under ${money(fromLocal(Number(budget)))}`
    : tier
      ? tierLabel[tier]
      : "Any budget";

  // Each filter is a pill that opens its picker; choices apply at once and "Show trips" closes it.
  const picker = (
    label: string,
    on: boolean,
    title: string,
    body: React.ReactNode,
  ) => (
    <StopDetails
      label={title}
      className={pill(on)}
      row={
        <>
          {label} <ChevronDown className="size-3.5" aria-hidden />
        </>
      }
    >
      <p className="pr-8 font-display text-xl font-semibold">{title}</p>
      <div className="mt-4">{body}</div>
      <form method="dialog" className="mt-5">
        <button className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-background">
          Show {shown.length} {shown.length === 1 ? "trip" : "trips"}
        </button>
      </form>
    </StopDetails>
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        {shown.length} {shown.length === 1 ? "trip" : "trips"}
        {names.length > 0 && ` in ${names.join(" + ")}`}
      </h1>
      <p className="mt-1 text-muted">
        {trip
          ? `${trip.days} days${trip.start ? ` · ${rangeLabel(trip.start, addDays(trip.start, trip.days - 1))}` : ""}${perCity ? ` · about ${perCity} in each city` : ""}`
          : "Your days, your budget."}{" "}
        <Link href="/quiz" className="underline">
          Not sure? Find your match
        </Link>
      </p>
      {guide}

      <div className="sticky top-0 z-20 -mx-4 mt-4 flex gap-2 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur sm:flex-wrap sm:overflow-visible">
        {picker(
          names.length ? names.join(" + ") : "Anywhere",
          where.length > 0,
          "Where?",
          <>
            <p className="mb-2 text-sm text-muted">
              Pick more than one to combine cities.
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
          </>,
        )}
        {picker(
          lengthLabel,
          length !== 0,
          "Trip length",
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
          </div>,
        )}
        {picker(
          budgetLabel,
          budget !== "" || tier !== "",
          "Budget",
          <div className="grid gap-4">
            <label className="block text-sm">
              <span className="font-medium">
                Max budget per person ({code})
              </span>
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
            <div>
              <p className="mb-2 text-sm font-medium">Budget style</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={chip(tier === "")}
                  aria-pressed={tier === ""}
                  onClick={() => setTier("")}
                >
                  Any
                </button>
                {TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={chip(tier === t)}
                    aria-pressed={tier === t}
                    onClick={() => setTier(t)}
                  >
                    {tierLabel[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>,
        )}
        {picker(
          vibes.length
            ? VIBES.filter((v) => vibes.includes(v.key))
                .map((v) => v.emoji)
                .join(" ")
            : "Trip type",
          vibes.length > 0,
          "What kind of trip?",
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
          </div>,
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {where.length > 1 ? (
          <p className="text-sm text-muted">
            Pick one route per city: your trip plan puts them back to back.
          </p>
        ) : (
          <span />
        )}
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
                list(inCity)
              ) : (
                <p className="mt-2 text-sm text-muted">
                  No {name} routes match. Try another trip length.
                </p>
              )}
            </section>
          );
        })
      ) : (
        list(shown)
      )}
      <p className="fine-print mt-4">
        Budgets are the creators&apos; listed prices for stays, activities and
        transport. Flights not included.
      </p>
    </div>
  );
}

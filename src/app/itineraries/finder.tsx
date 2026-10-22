"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { CreatorChip } from "@/components/creator";
import { useMoney } from "@/components/money";
import type { QuizData } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import type { Tier } from "@/generated/prisma/enums";

const LENGTHS = [
  { label: "Any length", min: 0, max: Infinity },
  { label: "1–3 days", min: 1, max: 3 },
  { label: "4–7 days", min: 4, max: 7 },
  { label: "8–14 days", min: 8, max: 14 },
  { label: "15+ days", min: 15, max: Infinity },
];
const TIERS: Tier[] = ["BACKPACKER", "BUDGET", "MIDRANGE", "LUXURY"];
const SORTS = { cheap: "Cheapest", short: "Shortest", long: "Longest" } as const;

/** Every creator route, filtered by trip length, budget, style and destination. Filtering runs in the browser. */
export function TripFinder({ routes }: { routes: QuizData["routes"] }) {
  const { money, code, fromLocal } = useMoney();
  const [length, setLength] = useState(0);
  const [budget, setBudget] = useState("");
  const [tier, setTier] = useState<Tier | "">("");
  const [where, setWhere] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("cheap");

  const destinations = useMemo(
    () =>
      [...new Map(routes.map((r) => [r.destination.slug, r.destination])).values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [routes],
  );

  const maxCents = budget ? fromLocal(Number(budget)) : null;
  const { min, max } = LENGTHS[length];
  const shown = routes
    .filter((r) => r.days >= min && r.days <= max)
    .filter((r) => !tier || r.tier === tier)
    .filter((r) => !where || r.destination.slug === where)
    // Routes with no prices, or unpriced hotels, can't be judged against a budget, so a budget hides them.
    .filter((r) => maxCents === null || (r.totalCents > 0 && r.unpricedStays === 0 && r.totalCents <= maxCents))
    .sort((a, b) =>
      sort === "short"
        ? a.days - b.days
        : sort === "long"
          ? b.days - a.days
          : (a.totalCents || Infinity) - (b.totalCents || Infinity),
    );

  const chip = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition ${
      on ? "bg-foreground font-medium text-background" : "border border-line bg-card text-muted hover:text-foreground"
    }`;

  return (
    <div className="mt-6">
      <div className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div>
          <p className="mb-2 text-sm font-medium">Trip length</p>
          <div className="flex flex-wrap gap-2">
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
        <div className="grid gap-4 sm:grid-cols-3">
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
            <span className="font-medium">Destination</span>
            <select
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
            >
              <option value="">Anywhere</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Style</span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier | "")}
              className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
            >
              <option value="">Any style</option>
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
          No trips match. Try a longer length or a bigger budget.
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {shown.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/itineraries/${r.slug}`}
                className="flex h-full flex-col rounded-2xl border border-line bg-card p-4 transition hover:border-accent"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium uppercase tracking-wide text-accent">{r.destination.name}</span>
                  <span className="text-muted">
                    {r.days} {r.days === 1 ? "day" : "days"} · {tierLabel[r.tier]}
                  </span>
                </div>
                <h2 className="mt-1 font-semibold">{r.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                  by <CreatorChip creator={r.creator} link={false} />
                </div>
                <div className="mt-auto flex items-end justify-between pt-3">
                  <p>
                    {r.totalCents > 0 ? (
                      <>
                        <span className="text-xl font-semibold tabular-nums">{money(r.totalCents)}</span>
                        <span className="text-xs text-muted">
                          {" "}
                          est. per person{r.unpricedCount > 0 && ` + ${r.unpricedCount} unpriced`}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted">Prices not listed</span>
                    )}
                  </p>
                  <ArrowRight className="size-4 text-accent" aria-hidden />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">
        Budgets are the creators&apos; listed prices for stays, activities and transport. Flights not included.
      </p>
    </div>
  );
}

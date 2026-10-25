"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CreatorChip } from "@/components/creator";
import { Thumb } from "@/components/thumb";
import { useMoney } from "@/components/money";
import type { QuizData } from "@/lib/data";
import { mostlyPriced, tierLabel } from "@/lib/format";
import { VIBES } from "@/lib/vibes";

export type Route = QuizData["routes"][number];

/** Lab: Bali routes, cheapest priced first, as if searched from home with "Bali, any length". */
export function pick(routes: Route[]) {
  return routes
    .filter((r) => r.destination.slug === "bali")
    .sort(
      (a, b) =>
        Number(!mostlyPriced(a)) - Number(!mostlyPriced(b)) || (a.totalCents || Infinity) - (b.totalCents || Infinity),
    );
}

export function Price({ r, big = false }: { r: Route; big?: boolean }) {
  const { money } = useMoney();
  if (r.totalCents > 0 && mostlyPriced(r))
    return <span className={`${big ? "text-2xl" : "text-lg"} font-semibold tabular-nums`}>{money(r.totalCents)}</span>;
  return <span className="text-sm text-muted">Partly priced</span>;
}

export const vibesOf = (r: Route) => VIBES.filter((v) => (r.vibes[v.key] ?? 0) >= 0.15);

/** The search the traveller came with, as a row of pills that each open their own picker. */
export function Pills() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {["Bali", "Any length", "Any budget", "Any style", "Trip type"].map((p, n) => (
        <button
          key={p}
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-sm ${n === 0 ? "bg-foreground font-medium text-background" : "border border-line bg-card"}`}
        >
          {p} <ChevronDown className="size-3.5" aria-hidden />
        </button>
      ))}
    </div>
  );
}

export function Card({ r, tall = false }: { r: Route; tall?: boolean }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-card">
      <div className="relative">
        <Thumb url={r.photoUrl} category="EXPERIENCE" className={`w-full ${tall ? "h-56" : "h-40"}`} />
        <span className="absolute top-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold">
          {r.days} {r.days === 1 ? "day" : "days"}
        </span>
      </div>
      <div className="p-4">
        <p className="eyebrow">{tierLabel[r.tier]}</p>
        <h2 className="mt-1 font-semibold">
          <Link href={`/itineraries/${r.slug}`} className="after:absolute after:inset-0">
            {r.title}
          </Link>
        </h2>
        <div className="relative z-10 mt-1 text-sm text-muted">
          by <CreatorChip creator={r.creator} />
        </div>
        <div className="mt-3 flex items-end justify-between">
          <Price r={r} />
          <span className="text-xs text-muted">{r.stops} stops</span>
        </div>
      </div>
    </article>
  );
}

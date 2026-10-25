"use client";

import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { TripMap } from "@/components/trip-map";
import { planMap } from "@/components/day-plan";
import { useMoney } from "@/components/money";
import { lineTotal } from "@/lib/cart-store";
import { dayColor } from "@/lib/map";
import { Row, Summary, useLab } from "../shared";

/** B: same folding days as the route page. Tap a stop to book, move day, add a note or remove (pop-up). */
export default function Days() {
  const { hydrated, cart, days, byDay, unplanned } = useLab();
  const { money } = useMoney();
  const { stops, groups } = useMemo(() => planMap(cart.items, days), [cart.items, days]);
  if (!hydrated) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-semibold">My trip</h1>
      <Summary sticky />
      <TripMap stops={stops} groups={groups} connect className="h-56 sm:h-72" />
      {byDay.map((items, n) => (
        <details key={n} open={n === 0} className="group rounded-2xl border border-line bg-card">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: dayColor(n) }}>{n + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Day {n + 1} <span className="text-sm font-normal text-muted">· {items.length} stops · {money(items.reduce((s, i) => s + lineTotal(i), 0))}</span></span>
              <span className="block truncate text-sm text-muted group-open:hidden">{items.map((i) => i.name).join(" · ") || "Nothing planned yet"}</span>
            </span>
            <ChevronDown className="size-5 text-muted transition group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="divide-y divide-line border-t border-line px-4">
            {items.map((i) => <li key={i.id}><Row i={i} /></li>)}
          </ul>
        </details>
      ))}
      {unplanned.length > 0 && (
        <section className="rounded-2xl border border-dashed border-line p-4">
          <h2 className="font-semibold">Not on a day yet ({unplanned.length})</h2>
          <ul className="divide-y divide-line">{unplanned.map((i) => <li key={i.id}><Row i={i} /></li>)}</ul>
        </section>
      )}
    </div>
  );
}

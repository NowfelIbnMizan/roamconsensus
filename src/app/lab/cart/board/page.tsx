"use client";

import { GripVertical, Map as MapIcon } from "lucide-react";
import { useMoney } from "@/components/money";
import { lineTotal } from "@/lib/cart-store";
import { dayColor } from "@/lib/map";
import { Row, Summary, useLab } from "../shared";

/** C: a board. Each day is a column (one per screen on a phone, swipe sideways); drag stops between days. */
export default function Board() {
  const { hydrated, byDay } = useLab();
  const { money } = useMoney();
  if (!hydrated) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-semibold">My trip</h1>
        <button className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm"><MapIcon className="size-4" aria-hidden /> Map</button>
      </div>
      <Summary />
      <p className="text-sm text-muted">Swipe through days. Drag a stop to move it.</p>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {byDay.map((items, n) => (
          <section key={n} className="w-[85%] shrink-0 snap-start rounded-2xl border border-line bg-card sm:w-72">
            <header className="flex items-center gap-2 rounded-t-2xl px-4 py-3 text-white" style={{ background: dayColor(n) }}>
              <span className="font-semibold">Day {n + 1}</span>
              <span className="ml-auto text-sm opacity-90">{money(items.reduce((s, i) => s + lineTotal(i), 0))}</span>
            </header>
            <ul className="divide-y divide-line px-3">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-1">
                  <GripVertical className="size-4 shrink-0 text-muted" aria-hidden />
                  <div className="min-w-0 flex-1"><Row i={i} /></div>
                </li>
              ))}
              {items.length === 0 && <li className="py-6 text-center text-sm text-muted">Drop stops here</li>}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

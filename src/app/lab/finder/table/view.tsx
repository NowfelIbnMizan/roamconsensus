"use client";

import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { CreatorChip } from "@/components/creator";
import { Thumb } from "@/components/thumb";
import { tierLabel } from "@/lib/format";
import { Pills, Price, pick, vibesOf, type Route } from "../shared";

/** B: a comparison list. One row per route with the numbers lined up, so routes compare at a glance. */
export function View({ routes }: { routes: Route[] }) {
  const shown = pick(routes);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{shown.length} trips in Bali</h1>
      <Pills />
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="hidden grid-cols-[minmax(0,1fr)_5rem_7rem_6rem] gap-4 border-b border-line px-4 py-2 text-xs text-muted sm:grid">
          <span>Route</span>
          <span className="inline-flex items-center gap-1">Days <ArrowUpDown className="size-3" /></span>
          <span>Style</span>
          <span className="inline-flex items-center justify-end gap-1">Price <ArrowUpDown className="size-3" /></span>
        </div>
        <ul className="divide-y divide-line">
          {shown.map((r) => (
            <li key={r.slug} className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-line/30 sm:grid-cols-[minmax(0,1fr)_5rem_7rem_6rem]">
              <div className="flex min-w-0 items-center gap-3">
                <Thumb url={r.photoUrl} category="EXPERIENCE" className="size-14 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <Link href={`/itineraries/${r.slug}`} className="block truncate font-medium after:absolute after:inset-0">
                    {r.title}
                  </Link>
                  <div className="relative z-10 truncate text-sm text-muted">
                    <CreatorChip creator={r.creator} />{" "}
                    {vibesOf(r).slice(0, 3).map((v) => <span key={v.key} title={v.label}>{v.emoji}</span>)}
                  </div>
                </div>
              </div>
              <span className="text-right sm:text-left">
                <span className="sm:hidden"><Price r={r} /></span>
                <span className="hidden tabular-nums sm:inline">{r.days}</span>
              </span>
              <span className="col-span-2 text-xs text-muted sm:hidden">{r.days} days · {tierLabel[r.tier]} · {r.stops} stops</span>
              <span className="hidden text-sm text-muted sm:inline">{tierLabel[r.tier]}</span>
              <span className="hidden text-right sm:inline"><Price r={r} /></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

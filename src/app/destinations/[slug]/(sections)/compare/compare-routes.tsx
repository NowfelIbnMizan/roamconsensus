"use client";

import Link from "next/link";
import { useState } from "react";
import { AllocationBar } from "@/components/allocation-bar";
import { CreatorChip } from "@/components/creator";
import { useMoney } from "@/components/money";
import type { getDestination } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { placeHref } from "@/lib/place";
import type { ItemCategory } from "@/generated/prisma/enums";

type Route = NonNullable<Awaited<ReturnType<typeof getDestination>>>["routes"][number];

export function CompareRoutes({
  destination,
  routes,
  places,
}: {
  destination: string;
  routes: Route[];
  places: Record<string, { name: string; category: ItemCategory }>;
}) {
  const [pick, setPick] = useState([routes[0].slug, routes[1].slug]);
  const { money } = useMoney();
  const [a, b] = pick.map((slug) => routes.find((r) => r.slug === slug)!);
  const inA = new Set(a.places);
  const inB = new Set(b.places);
  const both = a.places.filter((p) => inB.has(p));
  const onlyA = a.places.filter((p) => !inB.has(p));
  const onlyB = b.places.filter((p) => !inA.has(p));

  const rows: { label: string; value: (r: Route) => React.ReactNode }[] = [
    { label: "Style", value: (r) => tierLabel[r.tier] },
    { label: "Days", value: (r) => r.days },
    { label: "Total", value: (r) => (r.totalCents ? money(r.totalCents) : "Not listed") },
    { label: "Per day", value: (r) => (r.totalCents ? money(Math.round(r.totalCents / r.days)) : "–") },
    { label: "Stops", value: (r) => r.stops },
    { label: "Spend", value: (r) => (r.totalCents ? <AllocationBar allocation={r.allocation} /> : "–") },
  ];

  const list = (slugs: string[], empty: string) =>
    slugs.length === 0 ? (
      <p className="text-sm text-muted">{empty}</p>
    ) : (
      <ul className="space-y-1 text-sm">
        {slugs.map((s) => (
          <li key={s}>
            <Link href={placeHref(destination, s)} className="hover:text-accent hover:underline">
              {places[s]?.name ?? s}
            </Link>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mt-5 space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="w-24 p-3" />
              {[0, 1].map((n) => (
                <th key={n} className="p-3 text-left align-top font-normal">
                  <select
                    value={pick[n]}
                    onChange={(e) => setPick(n === 0 ? [e.target.value, pick[1]] : [pick[0], e.target.value])}
                    aria-label={`Route ${n + 1}`}
                    className="w-full rounded-lg border border-line bg-background px-2 py-1.5 font-medium"
                  >
                    {routes.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center gap-2">
                    <CreatorChip creator={(n === 0 ? a : b).creator} />
                    <Link href={`/itineraries/${(n === 0 ? a : b).slug}`} className="text-xs text-accent underline">
                      Full plan
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="p-3 text-muted">{row.label}</td>
                <td className="p-3 font-medium tabular-nums">{row.value(a)}</td>
                <td className="p-3 font-medium tabular-nums">{row.value(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-accent bg-accent-soft/40 p-4">
          <h3 className="font-semibold">Both include ({both.length})</h3>
          <p className="mb-2 text-xs text-muted">Safe bets: two creators picked them.</p>
          {list(both, "No spots in common.")}
        </section>
        <section className="rounded-2xl border border-line bg-card p-4">
          <h3 className="font-semibold">
            Only {a.creator.name} ({onlyA.length})
          </h3>
          <p className="mb-2 text-xs text-muted">{a.title}</p>
          {list(onlyA, "Nothing unique.")}
        </section>
        <section className="rounded-2xl border border-line bg-card p-4">
          <h3 className="font-semibold">
            Only {b.creator.name} ({onlyB.length})
          </h3>
          <p className="mb-2 text-xs text-muted">{b.title}</p>
          {list(onlyB, "Nothing unique.")}
        </section>
      </div>
    </div>
  );
}

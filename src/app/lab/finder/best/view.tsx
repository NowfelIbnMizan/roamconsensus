"use client";

import { Sparkles } from "lucide-react";
import { Card, Pills, pick, type Route } from "../shared";
import { mostlyPriced } from "@/lib/format";

/** C: one best match up top with the reason it won, then short shelves to compare against it. */
export function View({ routes }: { routes: Route[] }) {
  const shown = pick(routes);
  const [best, ...rest] = shown;
  const shelves = [
    { title: "Cheapest", list: rest.filter(mostlyPriced).slice(0, 6) },
    { title: "Short on time", list: [...rest].sort((a, b) => a.days - b.days).slice(0, 6) },
    { title: "Go slow", list: [...rest].sort((a, b) => b.days - a.days).slice(0, 6) },
  ];
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Bali, any length</h1>
      <Pills />
      <section className="rounded-3xl border-2 border-accent bg-card p-3 sm:p-4">
        <p className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-accent">
          <Sparkles className="size-4" aria-hidden /> Best match: cheapest fully priced route, {best.days} days
        </p>
        <Card r={best} tall />
      </section>
      {shelves.map((s) => (
        <section key={s.title}>
          <h2 className="mb-2 font-display text-xl font-semibold">{s.title}</h2>
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {s.list.map((r) => (
              <li key={r.slug} className="w-64 shrink-0 snap-start">
                <Card r={r} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

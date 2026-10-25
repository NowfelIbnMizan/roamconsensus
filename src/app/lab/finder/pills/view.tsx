"use client";

import { Card, Pills, pick, type Route } from "../shared";

/** A: search stays on top as pills (each opens a picker); results are big photo cards. */
export function View({ routes }: { routes: Route[] }) {
  const shown = pick(routes);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{shown.length} trips in Bali</h1>
      <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur">
        <Pills />
      </div>
      <p className="text-sm text-muted">Cheapest first</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((r) => (
          <li key={r.slug}>
            <Card r={r} />
          </li>
        ))}
      </ul>
    </div>
  );
}

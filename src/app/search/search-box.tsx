"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { SearchEntry } from "@/lib/data";

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

const order: SearchEntry["kind"][] = ["Destination", "Spot", "Itinerary", "Creator"];

export function SearchBox({ index }: { index: SearchEntry[] }) {
  const [q, setQ] = useState("");
  const words = fold(q).split(/\s+/).filter(Boolean);
  // Every word must appear; a hit in the title ranks above one only in the description.
  const results = words.length
    ? index
        .map((e) => ({ e, text: fold(e.text), title: fold(e.title) }))
        .filter(({ text }) => words.every((w) => text.includes(w)))
        .sort(
          (x, y) =>
            words.filter((w) => y.title.includes(w)).length - words.filter((w) => x.title.includes(w)).length ||
            order.indexOf(x.e.kind) - order.indexOf(y.e.kind),
        )
        .slice(0, 30)
        .map(({ e }) => e)
    : [];

  return (
    <div className="mt-6">
      <label className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 focus-within:border-accent">
        <Search className="size-5 text-muted" aria-hidden />
        <input
          autoFocus
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try “waterfall”, “Ubud”, “beach club” or a creator"
          aria-label="Search spots, itineraries, creators and destinations"
          className="w-full bg-transparent text-lg outline-none"
        />
      </label>
      {words.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          {results.length === 0
            ? "Nothing found. Try another word."
            : `${results.length} result${results.length > 1 ? "s" : ""}`}
        </p>
      )}
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card empty:hidden">
        {results.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="flex items-center gap-3 p-4 hover:bg-line/40">
              <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-accent">{r.kind}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.title}</span>
                <span className="block truncate text-sm text-muted">{r.sub}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { categoryLabel } from "@/lib/format";
import type { ItemCategory } from "@/generated/prisma/enums";

/**
 * Category chips over the server-rendered consensus list. Filtering is CSS-only:
 * this wrapper sets data-filter, and globals.css hides list rows whose data-cat doesn't match.
 */
export function ConsensusFilter({
  categories,
  counts,
  children,
}: {
  categories: ItemCategory[];
  counts: Record<string, number>;
  children: ReactNode;
}) {
  const [active, setActive] = useState("");
  const chip = (value: string, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setActive(value)}
      aria-pressed={active === value}
      className={`rounded-full px-3 py-1 text-sm transition ${
        active === value
          ? "bg-foreground font-medium text-background"
          : "border border-line bg-card text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div data-filter={active}>
      <div className="mt-4 flex flex-wrap gap-2">
        {chip("", "All")}
        {categories.map((c) => chip(c, `${categoryLabel[c]} ${counts[c]}`))}
      </div>
      {children}
    </div>
  );
}

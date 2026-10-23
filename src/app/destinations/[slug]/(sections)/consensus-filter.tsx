"use client";

import { useState, type ReactNode } from "react";
import { categoryLabel } from "@/lib/format";
import type { ItemCategory } from "@/generated/prisma/enums";

/** Rows shown under "All" before "Show all". Keep in step with the nth-child rule in globals.css. */
const CONSENSUS_PREVIEW = 20;

/**
 * Category chips over the server-rendered consensus list. Filtering is CSS-only:
 * this wrapper sets data-filter, and globals.css hides list rows whose data-cat doesn't match.
 * Under "All", only the top rows show until the visitor asks for the rest, so the page doesn't run on for screens.
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
  const [expanded, setExpanded] = useState(false);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
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
    <div data-filter={active} data-collapsed={!expanded && total > CONSENSUS_PREVIEW ? "" : undefined}>
      <div className="mt-4 flex flex-wrap gap-2">
        {chip("", "All")}
        {categories.map((c) => chip(c, `${categoryLabel[c]} ${counts[c]}`))}
      </div>
      {children}
      {!expanded && active === "" && total > CONSENSUS_PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mx-auto mt-4 flex rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium hover:border-accent"
        >
          Show all {total} places
        </button>
      )}
    </div>
  );
}

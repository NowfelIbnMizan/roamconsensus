"use client";

import { Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/** Pill tabs like the public city page. The open tab is kept in the address (#places), so a save reopens it. */
export function AdminTabs({
  tabs,
}: {
  tabs: { id: string; label: string; count?: number; warn?: boolean; panel: ReactNode }[];
}) {
  const [open, setOpen] = useState(tabs[0].id);
  useEffect(() => {
    const fromHash = () => {
      const id = location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) setOpen(id);
    };
    fromHash();
    addEventListener("hashchange", fromHash);
    return () => removeEventListener("hashchange", fromHash);
  }, [tabs]);

  return (
    <>
      <div role="tablist" className="mt-6 flex gap-2 overflow-x-auto pb-1 text-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={open === t.id}
            onClick={() => {
              setOpen(t.id);
              history.replaceState(null, "", `#${t.id}`);
            }}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 ${
              open === t.id ? "bg-foreground text-background" : "border border-line hover:border-line-strong"
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="opacity-60">{t.count}</span>}
            {t.warn && <span className="size-1.5 rounded-full bg-accent-2" aria-label="needs work" />}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={open !== t.id} className="mt-5">
          {t.panel}
        </div>
      ))}
    </>
  );
}

/**
 * Search box and "Needs fixing" switch for a grid of cards. Each card carries data-search (lowercase text) and
 * data-fix ("1" when something is missing); this only shows and hides them.
 */
export function CardFilter({ target, fixCount }: { target: string; fixCount: number }) {
  const [q, setQ] = useState("");
  const [fix, setFix] = useState(false);
  useEffect(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    document.querySelectorAll<HTMLElement>(`#${target} > [data-search]`).forEach((el) => {
      const text = el.dataset.search ?? "";
      el.hidden = (fix && el.dataset.fix !== "1") || !words.every((w) => text.includes(w));
    });
  }, [q, fix, target]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex min-w-56 flex-1 items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm">
        <Search className="size-4 text-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find by name or area"
          aria-label="Find by name or area"
          className="w-full bg-transparent outline-none"
        />
      </label>
      <button
        type="button"
        aria-pressed={fix}
        onClick={() => setFix(!fix)}
        className={`rounded-full border px-3 py-1.5 text-sm ${fix ? "border-accent bg-accent-soft" : "border-line bg-card"}`}
      >
        Needs fixing <span className="text-muted">{fixCount}</span>
      </button>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { HelpCircle, X } from "lucide-react";
import { GUIDES_KEY, guides, type GuideId } from "@/lib/guides";

function setHidden(id: GuideId, hidden: boolean) {
  const root = document.documentElement;
  const ids = new Set((root.dataset.guides ?? "").split(" ").filter(Boolean));
  if (hidden) ids.add(id);
  else ids.delete(id);
  root.dataset.guides = [...ids].join(" ");
  try {
    localStorage.setItem(GUIDES_KEY, root.dataset.guides);
  } catch {} // private mode: the note still hides for this visit
}

/**
 * A sticky note telling first-time visitors what they can do on this page. Hiding it is remembered on the device; a
 * small "How this works" link brings it back. Both states are in the HTML and CSS picks one from <html data-guides>,
 * which the pre-paint script fills, so a hidden note never flashes open.
 */
export function PageGuide({ id, className = "mb-8" }: { id: GuideId; className?: string }) {
  const tips = guides[id];
  return (
    <div data-guide={id} className={className}>
      <style>{`html[data-guides~="${id}"] [data-guide="${id}"] .guide-open,html:not([data-guides~="${id}"]) [data-guide="${id}"] .guide-closed{display:none}`}</style>
      <aside
        className="guide-open @container relative -rotate-[0.4deg] rounded-sm border border-sun/40 bg-sun/15 px-5 pt-3 pb-4 shadow-[0_6px_18px_-12px_rgb(43_33_24/0.4)]"
        aria-label="How this page works"
      >
        <button
          type="button"
          onClick={() => setHidden(id, true)}
          className="absolute top-2 right-2 rounded-full p-1.5 text-muted hover:bg-sun/20 hover:text-foreground"
          aria-label="Hide these tips"
        >
          <X className="size-4" aria-hidden />
        </button>
        <p className="font-hand text-2xl leading-tight text-accent-2">How this works</p>
        <ul className="mt-2 grid gap-x-6 gap-y-2 pr-6 text-sm @xl:grid-cols-2">
          {tips.map((t) => (
            <li key={t.lead} className="flex gap-2">
              <span aria-hidden className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-accent-2" />
              <span>
                <strong className="font-semibold">{/[.?!]$/.test(t.lead) ? t.lead : `${t.lead}.`}</strong>{" "}
                <span className="text-muted">{t.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setHidden(id, true)}
          className="mt-3 text-xs font-medium text-accent underline-offset-2 hover:underline"
        >
          Got it, hide tips
        </button>
      </aside>
      <button
        type="button"
        onClick={() => setHidden(id, false)}
        className="guide-closed inline-flex items-center gap-1 text-xs text-muted hover:text-accent"
      >
        <HelpCircle className="size-3.5" aria-hidden /> How this works
      </button>
    </div>
  );
}

const cityTabs: Record<string, GuideId> = {
  "": "city-itineraries",
  best: "city-best",
  stay: "city-stay",
  when: "city-when",
  before: "city-before",
  compare: "city-compare",
  budget: "city-budget",
  esim: "city-esim",
};

/** The guide for whichever city tab is open, placed once in the city layout under the tab row. */
export function CityTabGuide({ slug }: { slug: string }) {
  const tab = usePathname().slice(`/destinations/${slug}`.length).replace(/^\//, "");
  const id = cityTabs[tab];
  return id ? <PageGuide key={id} id={id} /> : null;
}

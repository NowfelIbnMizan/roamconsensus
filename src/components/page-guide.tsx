"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, HelpCircle } from "lucide-react";
import { guides, type GuideId } from "@/lib/guides";

/**
 * A folded "How this works" pill that opens into a short sticky note of tips. Folded by default so pages lead with
 * the content, not instructions; a native <details>, so it needs no script.
 */
export function PageGuide({
  id,
  className = "mb-6",
}: {
  id: GuideId;
  className?: string;
}) {
  const tips = guides[id];
  return (
    <details className={`group ${className}`}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted hover:text-accent [&::-webkit-details-marker]:hidden">
        <HelpCircle className="size-3.5" aria-hidden /> How this works
        <ChevronDown
          className="size-3.5 transition group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <aside
        className="@container mt-3 rounded-2xl border border-line bg-card px-5 py-4"
        aria-label="How this page works"
      >
        <ul className="grid gap-x-6 gap-y-2 text-sm @xl:grid-cols-2">
          {tips.map((t) => (
            <li key={t.lead} className="flex gap-2">
              <span
                aria-hidden
                className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-accent-2"
              />
              <span>
                <strong className="font-semibold">
                  {/[.?!]$/.test(t.lead) ? t.lead : `${t.lead}.`}
                </strong>{" "}
                <span className="text-muted">{t.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </details>
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
  const tab = usePathname()
    .slice(`/destinations/${slug}`.length)
    .replace(/^\//, "");
  const id = cityTabs[tab];
  return id ? <PageGuide key={id} id={id} /> : null;
}

"use client";

import { Check, ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import { Thumb } from "@/components/thumb";
import { LegHint } from "@/components/road-time";
import { categoryLabel } from "@/lib/format";
import { hasPin } from "@/lib/map";
import { directionsUrl, useToday } from "../shared";

/** A: one thing at a time. A big "Up next" card with one huge Directions button; the rest of the day is a short checklist. */
export default function NowLab() {
  const t = useToday();
  if (!t.hydrated) return null;
  const n = t.next;
  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => t.setDay(Math.max(1, t.day - 1))}
          aria-label="Previous day"
          className="flex size-10 items-center justify-center rounded-full border border-line"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <div className="text-center">
          <p className="text-sm text-muted">{t.city?.name}</p>
          <h1 className="text-2xl font-semibold">
            Day {t.day} of {t.days}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => t.setDay(Math.min(t.days, t.day + 1))}
          aria-label="Next day"
          className="flex size-10 items-center justify-center rounded-full border border-line"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      {n && (
        <section className="mt-5 overflow-hidden rounded-3xl border border-accent bg-card">
          <Thumb url={n.photoUrl} category={n.category} className="aspect-[16/10] w-full" />
          <div className="p-5">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">Up next</p>
            <h2 className="mt-1 text-2xl font-semibold">{n.name}</h2>
            <p className="text-sm text-muted">{categoryLabel[n.category]}</p>
            {n.note && <p className="mt-2 text-sm">{n.note}</p>}
            <LegHint leg={t.legs.get(n.id)} />
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              {hasPin(n) && (
                <a
                  href={directionsUrl(n)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-lg font-semibold text-background"
                >
                  <Navigation className="size-5" aria-hidden /> Directions
                </a>
              )}
              <button
                type="button"
                onClick={() => t.toggleDone(n.id)}
                className="flex items-center gap-2 rounded-2xl border border-line px-5 font-medium"
              >
                <Check className="size-5" aria-hidden /> Done
              </button>
            </div>
          </div>
        </section>
      )}

      <h2 className="mt-6 text-sm font-medium text-muted">
        Rest of the day · {t.doneCount} of {t.list.length} done
      </h2>
      <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-card">
        {t.list
          .filter((i) => i.id !== n?.id)
          .map((i) => {
            const done = t.done.includes(i.id);
            return (
              <li key={i.id} className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  onClick={() => t.toggleDone(i.id)}
                  aria-pressed={done}
                  aria-label={`Done: ${i.name}`}
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${done ? "border-accent bg-accent text-background" : "border-line"}`}
                >
                  {done && <Check className="size-4" aria-hidden />}
                </button>
                <span className={`min-w-0 flex-1 truncate ${done ? "text-muted line-through" : ""}`}>{i.name}</span>
                <Thumb url={i.photoUrl} category={i.category} className="size-10 shrink-0 rounded-lg" />
              </li>
            );
          })}
      </ul>
    </div>
  );
}

"use client";

import { Check, Navigation } from "lucide-react";
import { Thumb } from "@/components/thumb";
import { LegHint } from "@/components/road-time";
import { categoryLabel } from "@/lib/format";
import { hasPin } from "@/lib/map";
import { directionsUrl, useToday } from "../shared";

/** B: the day as a line. Progress bar on top, stops on a vertical line with the drive between them; finished stops shrink. */
export default function TimelineLab() {
  const t = useToday();
  if (!t.hydrated) return null;
  const pct = t.list.length ? Math.round((t.doneCount / t.list.length) * 100) : 0;
  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm text-muted">Today · {t.city?.name}</p>
      <h1 className="text-3xl font-semibold">Day {t.day}</h1>
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {Array.from({ length: t.days }, (_, n) => n + 1).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => t.setDay(d)}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${d === t.day ? "bg-foreground text-background" : "border border-line"}`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {t.doneCount} of {t.list.length} stops done
          </span>
          <span className="text-muted">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ol className="relative mt-6 border-l-2 border-line pl-6">
        {t.list.map((i) => {
          const done = t.done.includes(i.id);
          const isNext = i.id === t.next?.id;
          return (
            <li key={i.id} className="relative pb-6 last:pb-0">
              <button
                type="button"
                onClick={() => t.toggleDone(i.id)}
                aria-pressed={done}
                aria-label={`Done: ${i.name}`}
                className={`absolute top-0 -left-[2.4rem] flex size-7 items-center justify-center rounded-full border-2 bg-background ${done ? "border-accent bg-accent text-background" : isNext ? "border-accent" : "border-line"}`}
              >
                {done && <Check className="size-4" aria-hidden />}
              </button>
              {done ? (
                <p className="pt-0.5 text-sm text-muted line-through">{i.name}</p>
              ) : (
                <div className={`rounded-2xl border bg-card p-3 ${isNext ? "border-accent" : "border-line"}`}>
                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      {isNext && <p className="text-xs font-semibold tracking-wide text-accent uppercase">Next</p>}
                      <p className="font-semibold">{i.name}</p>
                      <p className="text-xs text-muted">{categoryLabel[i.category]}</p>
                    </div>
                    <Thumb url={i.photoUrl} category={i.category} className="size-14 shrink-0 rounded-xl" />
                  </div>
                  {isNext && hasPin(i) && (
                    <a
                      href={directionsUrl(i)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
                    >
                      <Navigation className="size-4" aria-hidden /> Directions
                    </a>
                  )}
                </div>
              )}
              <LegHint leg={t.legs.get(i.id)} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

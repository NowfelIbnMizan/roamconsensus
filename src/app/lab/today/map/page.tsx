"use client";

import { Check, Navigation } from "lucide-react";
import { Thumb } from "@/components/thumb";
import { TripMap } from "@/components/trip-map";
import { categoryHex, hasPin } from "@/lib/map";
import { categoryLabel } from "@/lib/format";
import { directionsUrl, useToday } from "../shared";

/** C: map first. The day's pins fill the top; stops are swipe cards underneath, each with Directions and Done. */
export default function MapLab() {
  const t = useToday();
  if (!t.hydrated) return null;
  const stops = t.pinned.map((i, n) => ({
    key: i.id,
    lat: i.lat!,
    lng: i.lng!,
    label: String(n + 1),
    color: t.done.includes(i.id) ? "#a8a29e" : categoryHex[i.category],
    title: i.name,
  }));
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">
          Day {t.day} <span className="text-muted">· {t.city?.name}</span>
        </h1>
        <select
          value={t.day}
          onChange={(e) => t.setDay(Number(e.target.value))}
          className="rounded-full border border-line bg-card px-3 py-1.5 text-sm"
          aria-label="Day"
        >
          {Array.from({ length: t.days }, (_, n) => n + 1).map((d) => (
            <option key={d} value={d}>
              Day {d}
            </option>
          ))}
        </select>
      </div>
      <TripMap stops={stops} connect className="mt-3 h-72 sm:h-96" />
      <p className="mt-3 text-sm text-muted">
        {t.doneCount} of {t.list.length} done · swipe for the next stop
      </p>
      <ol className="-mx-4 mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {t.list.map((i) => {
          const done = t.done.includes(i.id);
          const n = t.pinned.findIndex((p) => p.id === i.id);
          return (
            <li
              key={i.id}
              className={`w-[85%] shrink-0 snap-center rounded-2xl border bg-card p-3 sm:w-72 ${i.id === t.next?.id ? "border-accent" : "border-line"} ${done ? "opacity-60" : ""}`}
            >
              <div className="flex gap-3">
                <span className="relative shrink-0">
                  <Thumb url={i.photoUrl} category={i.category} className="size-16 rounded-xl" />
                  {n >= 0 && (
                    <span
                      className="absolute -top-1.5 -left-1.5 flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-card"
                      style={{ background: categoryHex[i.category] }}
                    >
                      {n + 1}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className={`font-semibold ${done ? "line-through" : ""}`}>{i.name}</p>
                  <p className="text-xs text-muted">{categoryLabel[i.category]}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {hasPin(i) && (
                  <a
                    href={directionsUrl(i)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent py-2 text-sm font-medium text-background"
                  >
                    <Navigation className="size-4" aria-hidden /> Directions
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => t.toggleDone(i.id)}
                  aria-pressed={done}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm"
                >
                  <Check className="size-4" aria-hidden /> Done
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

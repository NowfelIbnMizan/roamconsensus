"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Dates as YYYY-MM-DD strings in local time, so a picked day never shifts across a timezone. */
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** The date n days after a YYYY-MM-DD date. */
export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** Days from start to end, counting both. */
export const tripLength = (start: string, end: string) =>
  Math.round((parse(end).getTime() - parse(start).getTime()) / 86_400_000) + 1;

/** "3 – 14 Nov" or "28 Nov – 2 Dec". */
export function rangeLabel(start: string, end: string | null) {
  const a = parse(start);
  const fmt = (d: Date, month: boolean) =>
    d.toLocaleDateString(
      "en-GB",
      month ? { day: "numeric", month: "short" } : { day: "numeric" },
    );
  if (!end) return fmt(a, true);
  const b = parse(end);
  return `${fmt(a, a.getMonth() !== b.getMonth())} – ${fmt(b, true)}`;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function Month({
  first,
  start,
  end,
  hover,
  today,
  onPick,
  onHover,
}: {
  first: Date;
  start: string | null;
  end: string | null;
  hover: string | null;
  today: string;
  onPick: (day: string) => void;
  onHover: (day: string | null) => void;
}) {
  const lead = (first.getDay() + 6) % 7; // Monday first
  const count = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();
  const last = end ?? (start && hover && hover > start ? hover : null);
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-sm font-semibold">
        {first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 text-center text-xs text-muted">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-y-0.5 text-sm"
        onPointerLeave={() => onHover(null)}
      >
        {Array.from({ length: lead }, (_, i) => (
          <span key={`x${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const day = iso(
            new Date(first.getFullYear(), first.getMonth(), i + 1),
          );
          const past = day < today;
          const edge = day === start || day === last;
          const inside = start && last && day > start && day < last;
          return (
            <button
              key={day}
              type="button"
              disabled={past}
              onClick={() => onPick(day)}
              onPointerEnter={() => onHover(day)}
              aria-pressed={edge || !!inside}
              aria-label={parse(day).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              className={`h-9 tabular-nums transition ${
                edge
                  ? "rounded-full bg-accent font-semibold text-background"
                  : inside
                    ? "bg-accent-soft text-accent"
                    : past
                      ? "text-muted/40"
                      : "rounded-full hover:bg-line"
              } ${day === today && !edge ? "underline underline-offset-4" : ""}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A month calendar: tap the first day, then the last. One month on phones, two side by side on wider screens. */
export function DateRange({
  start,
  end,
  onChange,
}: {
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
}) {
  const now = new Date();
  const today = iso(now);
  const [view, setView] = useState(() => {
    const from = start ? parse(start) : now;
    return new Date(from.getFullYear(), from.getMonth(), 1);
  });
  const [hover, setHover] = useState<string | null>(null);
  const next = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  const atNow =
    view.getFullYear() === now.getFullYear() &&
    view.getMonth() === now.getMonth();

  const pick = (day: string) => {
    // A new range starts when there's none yet, it's already complete, or the tap is before the start.
    if (!start || end || day < start) onChange(day, null);
    else onChange(start, day);
  };
  const shift = (n: number) =>
    setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <div>
      <div className="relative flex gap-6">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={atNow}
          aria-label="Previous month"
          className="absolute top-0 left-0 flex size-7 items-center justify-center rounded-full hover:bg-line disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="absolute top-0 right-0 flex size-7 items-center justify-center rounded-full hover:bg-line"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        <Month
          first={view}
          {...{ start, end, hover, today }}
          onPick={pick}
          onHover={setHover}
        />
        <div className="hidden min-w-0 flex-1 sm:block">
          <Month
            first={next}
            {...{ start, end, hover, today }}
            onPick={pick}
            onHover={setHover}
          />
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted" aria-live="polite">
        {!start
          ? "Pick the day you leave"
          : !end
            ? "Now pick the day you come home"
            : `${rangeLabel(start, end)} · ${tripLength(start, end)} days`}
      </p>
    </div>
  );
}

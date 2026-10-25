"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloudRain, Search, Thermometer, Users } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { crowdLabel, monthNames, rateMonth, ratingLabel, type MonthInfo, type Rating } from "@/lib/seasons";

const fullMonth = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const tone: Record<Rating, { tile: string; badge: string }> = {
  great: { tile: "bg-accent text-background", badge: "bg-accent-soft text-accent" },
  good: { tile: "bg-amber-400 text-amber-950", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  wet: { tile: "bg-sky-500/25 text-sky-900 dark:text-sky-200", badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
};

/** Twelve coloured month tiles; tapping one shows that month's weather, crowds and note. */
export function MonthPicker({ months, name, slug }: { months: MonthInfo[]; name: string; slug: string }) {
  const startDate = useCart((s) => s.startDate);
  // The prerendered page shows the first best month; after load it moves to the trip's month, else this month.
  const [sel, setSel] = useState(() => months.find((m) => rateMonth(m) === "great")?.month ?? months[0].month);
  useEffect(() => {
    const month = startDate ? Number(startDate.slice(5, 7)) : new Date().getMonth() + 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the date and saved cart are only known after mount
    if (months.some((m) => m.month === month)) setSel(month);
  }, [startDate, months]);

  const m = months.find((x) => x.month === sel) ?? months[0];
  const r = rateMonth(m);
  const facts = [
    m.highC !== null && { icon: Thermometer, text: `${m.highC}°${m.lowC !== null ? ` / ${m.lowC}°C` : "C"}` },
    m.rainMm !== null && { icon: CloudRain, text: `${m.rainMm} mm rain` },
    m.crowd && { icon: Users, text: crowdLabel[m.crowd] },
  ].filter(Boolean) as { icon: typeof Users; text: string }[];

  return (
    <div className="mt-5 space-y-4">
      <p className="text-sm text-muted">When are you going? Tap a month.</p>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {months.map((x) => {
          const on = x.month === sel;
          return (
            <li key={x.month}>
              <button
                type="button"
                onClick={() => setSel(x.month)}
                aria-pressed={on}
                aria-label={`${fullMonth[x.month - 1]}: ${ratingLabel[rateMonth(x)]}`}
                className={`flex w-full flex-col items-center rounded-xl py-2.5 text-sm font-semibold transition ${tone[rateMonth(x)].tile} ${on ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-90 hover:opacity-100"}`}
              >
                {monthNames[x.month - 1]}
                {x.highC !== null && <span className="text-xs font-normal opacity-80">{x.highC}°</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {(Object.keys(tone) as Rating[]).map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${tone[t].tile}`} /> {ratingLabel[t]}
          </li>
        ))}
      </ul>
      <section className="rounded-2xl border border-line bg-card p-5" aria-live="polite">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-2xl font-semibold">{fullMonth[m.month - 1]}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${tone[r].badge}`}>{ratingLabel[r]}</span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          {facts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5">
              <Icon className="size-4" aria-hidden /> {text}
            </li>
          ))}
        </ul>
        {m.note && <p className="mt-3">{m.note}</p>}
        <Link
          href={`/itineraries?where=${slug}`}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          <Search className="size-4" aria-hidden /> See {name} trips
        </Link>
      </section>
    </div>
  );
}

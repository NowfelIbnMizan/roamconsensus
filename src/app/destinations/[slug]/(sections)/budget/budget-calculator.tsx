"use client";

import { useState } from "react";
import Link from "next/link";
import { BedDouble, Bus, Check, ChevronDown, Minus, Plus, Ticket, Utensils } from "lucide-react";
import { useMoney } from "@/components/money";
import { STYLES, type CostGuide, type Style } from "@/lib/costs";

type Stay = {
  name: string;
  priceCents: number;
  currency: string;
  tier: string;
  itinerary: string;
  creator: string;
};

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const parts = [
  { key: "stay", label: "Stay", icon: BedDouble, color: "#0f6b62" },
  { key: "food", label: "Food & drink", icon: Utensils, color: "#e0703f" },
  { key: "transport", label: "Getting around", icon: Bus, color: "#6b7280" },
  { key: "activities", label: "Sights", icon: Ticket, color: "#7c3aed" },
] as const;

/** Creator hotel picks for a style, priced in USD (anything else would need converting, so it is left out). */
function staysFor(stays: Stay[], style: Style) {
  const tiers: readonly string[] = STYLES.find((s) => s.key === style)!.tiers;
  return stays.filter((s) => tiers.includes(s.tier) && s.currency === "USD");
}

function estimate(guide: CostGuide, style: Style, nightCents: number, days: number, people: number) {
  const daily = guide.styles[style];
  const nights = Math.max(days - 1, 1);
  const rooms = Math.ceil(people / 2);
  const lines = {
    stay: nightCents * nights * rooms,
    food: daily.food * 100 * days * people,
    transport: daily.localTransport * 100 * days * people,
    activities: daily.activities * 100 * days * people,
  };
  const total = Object.values(lines).reduce((a, b) => a + b, 0);
  return { lines, total, perDay: Math.round(total / people / days) };
}

/** Typical night price for a style: the creators' picks if there are any, else the guide's figure. */
function typicalNight(guide: CostGuide, stays: Stay[], style: Style) {
  const picks = staysFor(stays, style);
  return picks.length ? median(picks.map((s) => s.priceCents)) : guide.styles[style].stayPerNight * 100;
}

/** All three travel styles side by side for the chosen days and people; the picked one shows where the money goes. */
export function BudgetCalculator({ guide, stays, place }: { guide: CostGuide; stays: Stay[]; place: string }) {
  const { money } = useMoney();
  const [days, setDays] = useState(5);
  const [people, setPeople] = useState(2);
  const [style, setStyle] = useState<Style>("midrange");
  const [stayPick, setStayPick] = useState("typical");

  const styleStays = staysFor(stays, style);
  const picked = styleStays.find((s) => `${s.itinerary}:${s.name}` === stayPick);
  const nightCents = picked ? picked.priceCents : typicalNight(guide, stays, style);
  const { lines, total } = estimate(guide, style, nightCents, days, people);
  const label = STYLES.find((s) => s.key === style)!.label;

  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Stepper value={days} min={1} max={60} onChange={setDays} unit={["day", "days"]} />
        <Stepper value={people} min={1} max={10} onChange={setPeople} unit={["person", "people"]} />
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        {STYLES.map((s) => {
          const c = estimate(
            guide,
            s.key,
            s.key === style ? nightCents : typicalNight(guide, stays, s.key),
            days,
            people,
          );
          const on = s.key === style;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => {
                  setStyle(s.key);
                  setStayPick("typical");
                }}
                aria-pressed={on}
                className={`relative w-full rounded-2xl border p-4 text-left transition ${
                  on ? "border-accent bg-accent-soft" : "border-line bg-card hover:border-foreground/30"
                }`}
              >
                {on && <Check className="absolute top-4 right-4 size-5 text-accent" aria-hidden />}
                <span className="block text-sm font-medium text-muted">{s.label}</span>
                <span className="mt-1 block text-3xl font-semibold tracking-tight tabular-nums">{money(c.total)}</span>
                <span className="text-sm text-muted">{money(c.perDay)} per person a day</span>
              </button>
            </li>
          );
        })}
      </ul>

      <section className="rounded-2xl border border-line bg-card p-5">
        <p className="text-sm font-medium">
          Where the money goes · {label}, {days} {days === 1 ? "day" : "days"} in {place}
        </p>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-line">
          {parts.map((p) => (
            <div key={p.key} style={{ width: `${total ? (lines[p.key] / total) * 100 : 0}%`, background: p.color }} />
          ))}
        </div>
        <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {parts.map((p) => (
            <li key={p.key} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
              <span className="text-muted">{p.label}</span>
              <span className="ml-auto font-medium tabular-nums">{money(lines[p.key])}</span>
            </li>
          ))}
        </ul>
        {styleStays.length > 0 && (
          <details className="group mt-4 border-t border-line pt-3 text-sm">
            <summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-accent [&::-webkit-details-marker]:hidden">
              {picked ? `Staying at ${picked.name}` : "Price it with a creator's hotel"}
              <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
            </summary>
            <select
              value={stayPick}
              onChange={(e) => setStayPick(e.target.value)}
              aria-label="Where you stay"
              className="mt-2 w-full rounded-lg border border-line bg-background px-2 py-2"
            >
              <option value="typical">
                Typical of the creators&apos; picks ({money(typicalNight(guide, stays, style))}/night)
              </option>
              {styleStays.map((s) => (
                <option key={`${s.itinerary}:${s.name}`} value={`${s.itinerary}:${s.name}`}>
                  {s.name}, {s.creator}&apos;s pick ({money(s.priceCents)}/night)
                </option>
              ))}
            </select>
            {picked && (
              <p className="mt-1 text-xs text-muted">
                From{" "}
                <Link href={`/itineraries/${picked.itinerary}`} className="underline">
                  {picked.creator}&apos;s route
                </Link>
                .
              </p>
            )}
          </details>
        )}
      </section>

      <p className="fine-print">
        Excludes flights, visas and shopping. Two travellers share a room. Daily spend checked {guide.checked}:{" "}
        {guide.sources.map((u, i) => (
          <span key={u}>
            {i > 0 && ", "}
            <a href={u} target="_blank" rel="noopener noreferrer" className="underline">
              {host(u)}
            </a>
          </span>
        ))}
        .
      </p>
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  unit,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit: [string, string];
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v || min));
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-card p-1">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={`Fewer ${unit[1]}`}
        className="flex size-8 items-center justify-center rounded-full hover:bg-line disabled:opacity-40"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className="min-w-20 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value} {value === 1 ? unit[0] : unit[1]}
      </span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={`More ${unit[1]}`}
        className="flex size-8 items-center justify-center rounded-full hover:bg-line disabled:opacity-40"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}

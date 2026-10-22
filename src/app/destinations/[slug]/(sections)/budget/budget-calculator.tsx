"use client";

import { useState } from "react";
import Link from "next/link";
import { BedDouble, Bus, Ticket, Utensils } from "lucide-react";
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

export function BudgetCalculator({ guide, stays, place }: { guide: CostGuide; stays: Stay[]; place: string }) {
  const { money } = useMoney();
  const [days, setDays] = useState(5);
  const [people, setPeople] = useState(2);
  const [style, setStyle] = useState<Style>("midrange");
  const [stayPick, setStayPick] = useState("typical");

  const daily = guide.styles[style];
  const tiers: readonly string[] = STYLES.find((s) => s.key === style)!.tiers;
  // Creator prices are stored in USD; anything else would need converting, so leave it out.
  const styleStays = stays.filter((s) => tiers.includes(s.tier) && s.currency === "USD");
  const picked = styleStays.find((s) => `${s.itinerary}:${s.name}` === stayPick);
  const nightCents = picked
    ? picked.priceCents
    : styleStays.length
      ? median(styleStays.map((s) => s.priceCents))
      : daily.stayPerNight * 100;

  const nights = Math.max(days - 1, 1);
  const rooms = Math.ceil(people / 2);
  const lines = [
    {
      key: "stay",
      label: `Stay: ${nights} nights × ${rooms} room${rooms > 1 ? "s" : ""}`,
      icon: BedDouble,
      cents: nightCents * nights * rooms,
    },
    { key: "food", label: "Food & drink", icon: Utensils, cents: daily.food * 100 * days * people },
    { key: "transport", label: "Getting around", icon: Bus, cents: daily.localTransport * 100 * days * people },
    { key: "activities", label: "Sights & activities", icon: Ticket, cents: daily.activities * 100 * days * people },
  ];
  const total = lines.reduce((s, l) => s + l.cents, 0);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-5 rounded-2xl border border-line bg-card p-5">
        <fieldset>
          <legend className="text-sm font-medium">Travel style</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setStyle(s.key);
                  setStayPick("typical");
                }}
                aria-pressed={style === s.key}
                className={`rounded-lg border px-2 py-2 text-sm transition ${
                  style === s.key ? "border-accent bg-accent/10 text-accent" : "border-line hover:border-foreground/30"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>
        <Stepper label="Days" value={days} min={1} max={60} onChange={setDays} />
        <Stepper label="Travellers" value={people} min={1} max={10} onChange={setPeople} />
        <label className="block text-sm">
          <span className="font-medium">Where you stay</span>
          <select
            value={stayPick}
            onChange={(e) => setStayPick(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-background px-2 py-2"
          >
            <option value="typical">
              {styleStays.length ? "Typical of the creators' picks" : "Typical for this style"} ({money(nightCents)}
              /night)
            </option>
            {styleStays.map((s) => (
              <option key={`${s.itinerary}:${s.name}`} value={`${s.itinerary}:${s.name}`}>
                {s.name}, {s.creator}&apos;s pick ({money(s.priceCents)}/night)
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted">Two travellers share a room. Hostel prices may be per bed.</p>
      </div>

      <div className="rounded-2xl border border-line bg-card p-5">
        <p className="text-sm text-muted">
          {days} days in {place}, {people} traveller{people > 1 ? "s" : ""}
        </p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">{money(total)}</p>
        <p className="mt-1 text-sm text-muted">
          {money(Math.round(total / people))} per person · {money(Math.round(total / people / days))} per person per day
        </p>
        <ul className="mt-5 space-y-3">
          {lines.map((l) => (
            <li key={l.key}>
              <div className="flex items-center gap-2 text-sm">
                <l.icon className="size-4 text-accent" aria-hidden />
                <span>{l.label}</span>
                <span className="ml-auto font-medium">{money(l.cents)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${total ? (l.cents / total) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-muted">
          Excludes flights, visas and shopping. Daily spend per person: food {money(daily.food * 100)}, transport{" "}
          {money(daily.localTransport * 100)}, sights {money(daily.activities * 100)}.
          {picked && (
            <>
              {" "}
              Hotel price from{" "}
              <Link href={`/itineraries/${picked.itinerary}`} className="underline">
                {picked.creator}&apos;s route
              </Link>
              .
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-muted">
          Checked {guide.checked}. Sources:{" "}
          {guide.sources.map((u, i) => (
            <span key={u}>
              {i > 0 && ", "}
              <a href={u} target="_blank" rel="noopener noreferrer" className="underline">
                {host(u)}
              </a>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v || min));
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          aria-label={`Fewer ${label.toLowerCase()}`}
          className="size-8 rounded-full border border-line hover:border-foreground/30"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          aria-label={label}
          className="w-14 rounded-md border border-line bg-background px-1 py-1 text-center"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          aria-label={`More ${label.toLowerCase()}`}
          className="size-8 rounded-full border border-line hover:border-foreground/30"
        >
          +
        </button>
      </div>
    </div>
  );
}

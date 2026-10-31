"use client";

import { Check, ChevronDown, Compass } from "lucide-react";
import { useCurrencyCode, useCurrencyStore } from "@/components/money";
import { useFlagFont, usePassport } from "@/components/visa-check";
import type { Tier } from "@/generated/prisma/enums";
import { CURRENCIES } from "@/lib/currency";
import { tierLabel } from "@/lib/format";
import { usePrefs, usePrefsStore } from "@/lib/prefs";
import { LENGTHS } from "@/lib/trip-lengths";
import { flag, PASSPORTS } from "@/lib/visa";

export type City = { slug: string; name: string };

const tiers = [
  { value: "", label: "Any style" },
  ...(Object.keys(tierLabel) as Tier[]).map((t) => ({ value: t, label: tierLabel[t] })),
];
const lengths = LENGTHS.map((l, n) => ({ value: String(n), label: l.label }));
const passports = [{ value: "", label: "Pick one" }, ...PASSPORTS.map((p) => ({ value: p, label: `${flag(p)} ${p}` }))];
const currencies = CURRENCIES.map((c) => ({ value: c.code, label: c.code }));

/** A native select that reads as its value with a small chevron; the phone opens its own picker. */
function ValueSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <span className="relative inline-flex min-w-0 items-center">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flag-font max-w-48 cursor-pointer appearance-none truncate bg-transparent py-1 pr-5 text-right text-sm font-medium [field-sizing:content] hover:text-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 size-3.5 text-muted" aria-hidden />
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      {children}
    </div>
  );
}

/**
 * The traveller's private travel profile as a short settings list: the trip finder and quiz start from their style
 * and length, the visa check from their passport, prices from their currency, and "Where to next?" puts cities
 * they've been to last.
 */
export function MyTravelRows({ cities }: { cities: City[] }) {
  const prefs = usePrefs();
  const update = usePrefsStore((s) => s.update);
  const toggleBeen = usePrefsStore((s) => s.toggleBeen);
  const [passport, setPassport] = usePassport();
  const currency = useCurrencyCode() ?? "USD";
  const setCurrency = useCurrencyStore((s) => s.set);
  useFlagFont();

  return (
    <div>
      <p className="eyebrow flex items-center gap-1.5">
        <Compass className="size-3.5 text-accent" aria-hidden /> My travel
      </p>
      <div className="mt-1 divide-y divide-line">
        <Row label="Style">
          <ValueSelect
            label="How I travel"
            value={prefs.tier}
            onChange={(v) => update({ tier: v as Tier | "" })}
            options={tiers}
          />
        </Row>
        <Row label="Trip length">
          <ValueSelect
            label="Usual trip length"
            value={String(prefs.length)}
            onChange={(v) => update({ length: Number(v) })}
            options={lengths}
          />
        </Row>
        <Row label="Passport">
          <ValueSelect label="My passport" value={passport} onChange={setPassport} options={passports} />
        </Row>
        <Row label="Prices in">
          <ValueSelect label="Show prices in" value={currency} onChange={setCurrency} options={currencies} />
        </Row>
        <details className="group py-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm [&::-webkit-details-marker]:hidden">
            <span className="text-muted">Been to</span>
            <span className="inline-flex items-center gap-1 font-medium hover:text-accent">
              {prefs.been.length
                ? `${prefs.been.length} of ${cities.length} ${cities.length === 1 ? "city" : "cities"}`
                : "Tick cities"}
              <ChevronDown className="size-3.5 text-muted transition group-open:rotate-180" aria-hidden />
            </span>
          </summary>
          <div className="flex flex-wrap gap-1.5 pt-3">
            {cities.map((c) => {
              const on = prefs.been.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleBeen(c.slug)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                    on ? "bg-foreground text-background" : "border border-line bg-card hover:border-accent"
                  }`}
                >
                  {on && <Check className="size-3" aria-hidden />}
                  {c.name}
                </button>
              );
            })}
          </div>
        </details>
      </div>
      <p className="fine-print">Only you see this. Finder, quiz, visa check and prices start from it.</p>
    </div>
  );
}

/** My travel on its own card, for visitors who aren't signed in. */
export function MyTravel({ cities }: { cities: City[] }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <MyTravelRows cities={cities} />
    </section>
  );
}

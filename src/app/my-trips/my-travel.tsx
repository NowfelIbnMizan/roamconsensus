"use client";

import { Check, Compass } from "lucide-react";
import { CurrencyPicker } from "@/components/money";
import { PassportPicker } from "@/components/visa-check";
import type { Tier } from "@/generated/prisma/enums";
import { tierLabel } from "@/lib/format";
import { usePrefs, usePrefsStore } from "@/lib/prefs";
import { LENGTHS } from "@/lib/trip-lengths";

const pill = (on: boolean) =>
  `inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
    on ? "bg-foreground text-background" : "border border-line bg-card hover:border-accent"
  }`;

/**
 * The traveller's private travel profile: the trip finder and quiz start from their style and length, the visa check
 * from their passport, prices from their currency, and "Where to next?" puts cities they've been to last.
 */
export function MyTravel({ cities }: { cities: { slug: string; name: string }[] }) {
  const prefs = usePrefs();
  const update = usePrefsStore((s) => s.update);
  const toggleBeen = usePrefsStore((s) => s.toggleBeen);

  return (
    <section className="mt-10 rounded-2xl border border-line bg-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Compass className="size-5 text-accent" aria-hidden /> My travel
      </h2>
      <p className="mt-1 text-sm text-muted">Only you see this. It sets up the finder, quiz, visa check and prices for you.</p>

      <dl className="mt-5 space-y-5">
        <div>
          <dt className="eyebrow">How I travel</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(tierLabel) as Tier[]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={prefs.tier === t}
                onClick={() => update({ tier: prefs.tier === t ? "" : t })}
                className={pill(prefs.tier === t)}
              >
                {tierLabel[t]}
              </button>
            ))}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Usual trip length</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {LENGTHS.slice(1).map((l, n) => (
              <button
                key={l.label}
                type="button"
                aria-pressed={prefs.length === n + 1}
                onClick={() => update({ length: prefs.length === n + 1 ? 0 : n + 1 })}
                className={pill(prefs.length === n + 1)}
              >
                {l.label}
              </button>
            ))}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Passport and currency</dt>
          <dd className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-3">
            <PassportPicker />
            <span className="flex items-center gap-2 text-sm">
              <span className="font-medium">Prices in</span>
              <CurrencyPicker />
            </span>
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Cities I&apos;ve been to</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {cities.map((c) => {
              const on = prefs.been.includes(c.slug);
              return (
                <button key={c.slug} type="button" aria-pressed={on} onClick={() => toggleBeen(c.slug)} className={pill(on)}>
                  {on && <Check className="size-3.5" aria-hidden />}
                  {c.name}
                </button>
              );
            })}
          </dd>
        </div>
      </dl>
    </section>
  );
}

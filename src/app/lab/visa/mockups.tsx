"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Check, ChevronDown, CircleAlert, ExternalLink, Stamp } from "lucide-react";
import { usePassport } from "@/components/visa-check";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { PASSPORTS, visaRules, visaStatusLabel, type VisaRule, type VisaStatus } from "@/lib/visa";

export type LabCity = { slug: string; name: string; country: string };

const tone: Record<VisaStatus, string> = {
  VISA_FREE: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  HOME: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  VISA_ON_ARRIVAL: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  E_VISA: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  VISA_REQUIRED: "bg-red-500/10 text-red-700 dark:text-red-300",
};
const ok = (r?: VisaRule) => r && (r.status === "VISA_FREE" || r.status === "HOME");
const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

function group(cities: LabCity[]) {
  const m = new Map<string, LabCity[]>();
  cities.filter((c) => visaRules[c.country]).forEach((c) => m.set(c.country, [...(m.get(c.country) ?? []), c]));
  return [...m.entries()];
}

function useTripCountries(cities: LabCity[]) {
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  if (!hydrated) return new Set<string>();
  const slugs = new Set(items.map((i) => i.destination?.slug).filter(Boolean));
  return new Set(cities.filter((c) => slugs.has(c.slug)).map((c) => c.country));
}

function Chip({ rule }: { rule?: VisaRule }) {
  if (!rule) return <span className="text-sm text-muted">No data yet</span>;
  const Icon = ok(rule) ? BadgeCheck : CircleAlert;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${tone[rule.status]}`}>
      <Icon className="size-4" aria-hidden />
      {visaStatusLabel[rule.status]}
      {rule.days && rule.status !== "HOME" && <span className="font-normal">· {rule.days} days</span>}
    </span>
  );
}

function BigPicker() {
  const [passport, setPassport] = usePassport();
  return (
    <label className="flex flex-col gap-1.5 sm:max-w-sm">
      <span className="eyebrow flex items-center gap-1.5">
        <Stamp className="size-3.5" aria-hidden /> My passport
      </span>
      <select
        value={passport}
        onChange={(e) => setPassport(e.target.value)}
        className="rounded-xl border border-line bg-card px-4 py-3 text-lg font-medium"
      >
        <option value="">Choose…</option>
        {PASSPORTS.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
    </label>
  );
}

function Details({ country }: { country: string }) {
  const r = visaRules[country];
  return (
    <>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
        {r.common.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p className="fine-print mt-2">
        Checked {r.checked}. Confirm before you book:{" "}
        {r.sources.map((u, i) => (
          <span key={u}>
            {i > 0 && ", "}
            <a href={u} target="_blank" rel="noopener noreferrer" className="underline">
              {host(u)}
            </a>
          </span>
        ))}
      </p>
    </>
  );
}

/* A: one answer list. Big passport picker, then one row per country: status chip, cities, fold for the rest. */
export function MockA({ cities }: { cities: LabCity[] }) {
  const [passport] = usePassport();
  const trip = useTripCountries(cities);
  const rows = group(cities).sort(([a], [b]) => Number(trip.has(b)) - Number(trip.has(a)));
  const free = rows.filter(([c]) => ok(visaRules[c].passports[passport])).length;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Do I need a visa?</h1>
      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <BigPicker />
        {passport && (
          <p className="pb-3 text-sm text-muted">
            <span className="font-semibold text-foreground">{free} of {rows.length}</span> countries: no visa needed.
          </p>
        )}
      </div>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {rows.map(([country, list]) => (
          <li key={country}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold">
                    {country}
                    {trip.has(country) && (
                      <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">In your trip</span>
                    )}
                  </span>
                  <span className="block text-sm text-muted">{list.map((c) => c.name).join(", ")}</span>
                </span>
                {passport ? <Chip rule={visaRules[country].passports[passport]} /> : <span className="text-sm text-muted">Pick passport</span>}
                <ChevronDown className="size-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
              </summary>
              <div className="px-4 pb-4">
                {visaRules[country].passports[passport]?.note && (
                  <p className="mb-3 text-sm">{visaRules[country].passports[passport].note}</p>
                )}
                <Details country={country} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}

/* B: three buckets. Countries sorted into "Just go" / "Sort it online" / "Visa needed" columns. */
export function MockB({ cities }: { cities: LabCity[] }) {
  const [passport] = usePassport();
  const trip = useTripCountries(cities);
  const rows = group(cities);
  const bucket = (r?: VisaRule) =>
    !r ? 3 : ok(r) ? 0 : r.status === "VISA_REQUIRED" ? 2 : 1;
  const cols = [
    { title: "Just go", sub: "No visa needed", ring: "border-t-emerald-500" },
    { title: "Sort it before you fly", sub: "Online or on arrival", ring: "border-t-amber-500" },
    { title: "Visa needed", sub: "Apply well before you fly", ring: "border-t-red-500" },
  ];

  return (
    <>
      <p className="eyebrow">Visa check</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Where can you just go?</h1>
      <div className="mt-5">
        <BigPicker />
      </div>
      {!passport ? (
        <p className="mt-8 text-muted">Pick your passport to sort the {rows.length} countries.</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cols.map((col, i) => {
            const here = rows.filter(([c]) => bucket(visaRules[c].passports[passport]) === i);
            return (
              <section key={col.title} className={`rounded-2xl border border-t-4 border-line bg-card p-4 ${col.ring}`}>
                <h2 className="font-semibold">{col.title}</h2>
                <p className="text-sm text-muted">{col.sub}</p>
                {here.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">None for {passport}.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {here.map(([country, list]) => {
                      const r = visaRules[country].passports[passport];
                      return (
                        <li key={country} className="rounded-xl border border-line p-3">
                          <p className="flex items-center justify-between gap-2 font-medium">
                            {country}
                            {r?.days && <span className="text-sm font-normal text-muted">{r.days} days</span>}
                          </p>
                          <p className="text-sm text-muted">
                            {list.map((c, j) => (
                              <span key={c.slug}>
                                {j > 0 && ", "}
                                <Link href={`/destinations/${c.slug}/before`} className="hover:underline">{c.name}</Link>
                              </span>
                            ))}
                          </p>
                          {trip.has(country) && <p className="mt-1 text-xs font-medium text-accent">In your trip</p>}
                          {r?.note && <p className="mt-2 line-clamp-2 text-xs text-muted">{r.note}</p>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
      <details className="mt-8">
        <summary className="cursor-pointer text-sm font-medium text-accent">What every visitor needs, by country</summary>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {rows.map(([country]) => (
            <div key={country}>
              <h3 className="font-semibold">{country}</h3>
              <Details country={country} />
            </div>
          ))}
        </div>
      </details>
    </>
  );
}

/* C: pick a city, get one big answer plus a tick-off checklist. Passport and city as two steps. */
export function MockC({ cities }: { cities: LabCity[] }) {
  const [passport] = usePassport();
  const list = cities.filter((c) => visaRules[c.country]);
  const [slug, setSlug] = useState(list[0]?.slug);
  const city = list.find((c) => c.slug === slug)!;
  const rules = visaRules[city.country];
  const rule = passport ? rules.passports[passport] : undefined;
  const [done, setDone] = useState<string[]>([]);
  const pill = (on: boolean) =>
    `inline-flex shrink-0 rounded-full px-3.5 py-2 text-sm transition ${
      on ? "bg-foreground font-medium text-background" : "border border-line bg-card hover:border-accent"
    }`;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Do I need a visa?</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="min-w-0 space-y-5">
          <BigPicker />
          <div>
            <p className="eyebrow mb-2">Going to</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {list.map((c) => (
                <button key={c.slug} type="button" className={pill(c.slug === slug)} onClick={() => setSlug(c.slug)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <section className="min-w-0 rounded-2xl border border-line bg-card p-5 sm:p-6">
          <p className="eyebrow">{city.country}</p>
          <h2 className="mt-1 text-2xl font-semibold">{city.name}</h2>
          <div className="mt-4">
            {!passport ? (
              <p className="text-muted">Pick your passport for the answer.</p>
            ) : (
              <>
                <Chip rule={rule} />
                {rule?.note && <p className="mt-2 text-sm">{rule.note}</p>}
              </>
            )}
          </div>
          <h3 className="mt-6 font-semibold">Before you fly ({done.length}/{rules.common.length})</h3>
          <ul className="mt-2 space-y-2">
            {rules.common.map((c) => {
              const on = done.includes(c);
              return (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => setDone(on ? done.filter((d) => d !== c) : [...done, c])}
                    className="flex w-full items-start gap-3 text-left text-sm"
                  >
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
                        on ? "border-accent bg-accent text-background" : "border-line-strong"
                      }`}
                    >
                      {on && <Check className="size-3.5" aria-hidden />}
                    </span>
                    <span className={on ? "text-muted line-through" : ""}>{c}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="fine-print mt-4">
            Checked {rules.checked}. Confirm before you book:{" "}
            {rules.sources.map((u, i) => (
              <span key={u}>
                {i > 0 && ", "}
                <a href={u} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline">
                  {host(u)}
                  <ExternalLink className="size-2.5" aria-hidden />
                </a>
              </span>
            ))}
          </p>
          <Link href={`/destinations/${city.slug}/before`} className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
            More {city.name} before-you-go tips →
          </Link>
        </section>
      </div>
    </>
  );
}

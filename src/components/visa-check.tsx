"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { BadgeCheck, Check, ChevronDown, CircleAlert, Stamp } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import {
  flag,
  PASSPORTS,
  visaStatusLabel,
  type CountryVisa,
  type VisaRule,
  type VisaStatus,
} from "@/lib/visa";

const usePassportStore = create<{
  passport: string;
  set: (p: string) => void;
  /** Ticked "before you fly" items, as "Country: item text". */
  done: string[];
  toggle: (key: string) => void;
}>()(
  persist(
    (set) => ({
      passport: "",
      set: (passport) => set({ passport }),
      done: [],
      toggle: (key) =>
        set((s) => ({
          done: s.done.includes(key)
            ? s.done.filter((d) => d !== key)
            : [...s.done, key],
        })),
    }),
    {
      name: "roamconsensus-passport",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

const subscribe = (cb: () => void) => {
  const unsubHydrate = usePassportStore.persist.onFinishHydration(cb);
  const unsub = usePassportStore.subscribe(cb);
  if (!usePassportStore.persist.hasHydrated())
    void usePassportStore.persist.rehydrate();
  return () => {
    unsubHydrate();
    unsub();
  };
};

/** The traveller's passport, remembered on this device; "" until chosen or before it has loaded. */
function usePassport() {
  const passport = useSyncExternalStore(
    subscribe,
    () => usePassportStore.getState().passport,
    () => "",
  );
  return [passport, usePassportStore((s) => s.set)] as const;
}

const tone: Record<VisaStatus, string> = {
  VISA_FREE:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  HOME: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  VISA_ON_ARRIVAL:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  E_VISA:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  VISA_REQUIRED:
    "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

// Windows draws flag emojis as two letters; there, load a flag-only font (self-hosted, credited on /disclosure).
let flagsPolyfilled = false;
function useFlagFont() {
  useEffect(() => {
    if (flagsPolyfilled) return;
    flagsPolyfilled = true;
    polyfillCountryFlagEmojis("Twemoji Country Flags", "/fonts/TwemojiCountryFlags.woff2");
  }, []);
}

const isOk = (r?: VisaRule) =>
  r?.status === "VISA_FREE" || r?.status === "HOME";

export function PassportPicker({ big = false }: { big?: boolean }) {
  const [passport, setPassport] = usePassport();
  useFlagFont();
  if (big)
    return (
      <label className="flex flex-col gap-1.5 sm:w-80">
        <span className="eyebrow flex items-center gap-1.5">
          <Stamp className="size-3.5" aria-hidden />
          My passport
        </span>
        <select
          value={passport}
          onChange={(e) => setPassport(e.target.value)}
          className="flag-font rounded-xl border border-line bg-card px-4 py-3 text-lg font-medium"
        >
          <option value="">Your passport</option>
          {PASSPORTS.map((p) => (
            <option key={p} value={p}>
              {flag(p)} {p}
            </option>
          ))}
        </select>
      </label>
    );
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <Stamp className="size-4 text-accent" aria-hidden />
      <span className="font-medium">My passport</span>
      <select
        value={passport}
        onChange={(e) => setPassport(e.target.value)}
        className="flag-font rounded-lg border border-line bg-background px-2 py-1.5"
      >
        <option value="">Your passport</option>
        {PASSPORTS.map((p) => (
          <option key={p} value={p}>
            {flag(p)} {p}
          </option>
        ))}
      </select>
    </label>
  );
}

/** The chosen passport's entry rule for one country, plus what every visitor needs. */
export function VisaResult({
  country,
  rules,
  compact = false,
}: {
  country: string;
  rules: CountryVisa;
  compact?: boolean;
}) {
  const [passport] = usePassport();
  const rule = passport ? rules.passports[passport] : undefined;
  const Icon =
    rule && (rule.status === "VISA_FREE" || rule.status === "HOME")
      ? BadgeCheck
      : CircleAlert;

  return (
    <div>
      {!passport ? (
        <p className="text-sm text-muted">
          Choose your passport to see the rules for {country}.
        </p>
      ) : !rule ? (
        <p className="text-sm text-muted">
          No data for a {passport} passport yet. Check the official links below.
        </p>
      ) : (
        <div className={`rounded-xl border p-3 ${tone[rule.status]}`}>
          <p className="flex items-center gap-2 font-medium">
            <Icon className="size-4" aria-hidden />
            {visaStatusLabel[rule.status]}
            {rule.days && rule.status !== "HOME" && (
              <span className="font-normal">· up to {rule.days} days</span>
            )}
          </p>
          {rule.note && (
            <p className="mt-1 text-sm text-foreground/80">{rule.note}</p>
          )}
        </div>
      )}
      {!compact && (
        // Folded: the passport answer is what people came for; the shared rules are one tap away.
        <details className="group mt-3">
          <summary className="cursor-pointer text-sm font-medium text-accent hover:underline">
            What every visitor needs ({rules.common.length})
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {rules.common.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="fine-print mt-2">
            Checked {rules.checked}. Rules change: confirm on the official sites
            before you book.{" "}
            {rules.sources.map((u, i) => (
              <span key={u}>
                {i > 0 && ", "}
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {host(u)}
                </a>
              </span>
            ))}
          </p>
        </details>
      )}
    </div>
  );
}

/**
 * The visa page: one row per country with the answer for the chosen passport, trip countries first. A row opens to
 * the passport note, a tick-off "before you fly" list (remembered on this device) and the official links.
 */
export function VisaList({
  countries,
}: {
  countries: {
    country: string;
    rules: CountryVisa;
    cities: { slug: string; name: string }[];
  }[];
}) {
  const [passport] = usePassport();
  const done = usePassportStore((s) => s.done);
  const toggle = usePassportStore((s) => s.toggle);
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const tripSlugs = new Set(
    hydrated ? items.map((i) => i.destination?.slug) : [],
  );
  const inTrip = (c: (typeof countries)[number]) =>
    c.cities.some((d) => tripSlugs.has(d.slug));
  const rows = [...countries].sort(
    (a, b) => Number(inTrip(b)) - Number(inTrip(a)),
  );
  const free = rows.filter((c) => isOk(c.rules.passports[passport])).length;

  return (
    <>
      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <PassportPicker big />
        {passport && (
          <p className="text-sm text-muted sm:pb-3.5">
            <span className="font-semibold text-foreground">
              {free} of {rows.length}
            </span>{" "}
            countries: no visa needed.
          </p>
        )}
      </div>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {rows.map(({ country, rules, cities }) => {
          const rule = passport ? rules.passports[passport] : undefined;
          const Icon = isOk(rule) ? BadgeCheck : CircleAlert;
          const ticked = rules.common.filter((c) =>
            done.includes(`${country}: ${c}`),
          ).length;
          return (
            <li key={country}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="flag-font text-2xl leading-none">
                    {flag(country)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 font-semibold">
                      {country}
                      {inTrip({ country, rules, cities }) && (
                        <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
                          In your trip
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-muted">
                      {cities.map((d) => d.name).join(", ")}
                    </span>
                  </span>
                  {!passport ? (
                    <span className="text-sm text-muted">Pick passport</span>
                  ) : !rule ? (
                    <span className="text-sm text-muted">Not checked yet. Use the official link.</span>
                  ) : (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${tone[rule.status]}`}
                    >
                      <Icon className="size-4" aria-hidden />
                      {visaStatusLabel[rule.status]}
                      {rule.days && rule.status !== "HOME" && (
                        <span className="hidden font-normal sm:inline">
                          · {rule.days} days
                        </span>
                      )}
                    </span>
                  )}
                  <ChevronDown
                    className="size-4 shrink-0 text-muted transition group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-4 pb-5 sm:pl-14">
                  {rule && (
                    <p className="text-sm">
                      {rule.days && rule.status !== "HOME" && (
                        <span className="font-medium">
                          Up to {rule.days} days.{" "}
                        </span>
                      )}
                      {rule.note}
                    </p>
                  )}
                  {!rule && passport && (
                    <p className="text-sm text-muted">
                      No data for a {passport} passport yet. Check the
                      official links below.
                    </p>
                  )}
                  <h3 className="mt-4 text-sm font-semibold">
                    Before you fly ({ticked}/{rules.common.length})
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {rules.common.map((c) => {
                      const key = `${country}: ${c}`;
                      const on = done.includes(key);
                      return (
                        <li key={c}>
                          <button
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(key)}
                            className="flex w-full items-start gap-3 text-left text-sm"
                          >
                            <span
                              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
                                on
                                  ? "border-accent bg-accent text-background"
                                  : "border-line-strong"
                              }`}
                            >
                              {on && <Check className="size-3.5" aria-hidden />}
                            </span>
                            <span className={on ? "text-muted line-through" : ""}>
                              {c}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="fine-print mt-3">
                    Checked {rules.checked}. Rules change: confirm on the
                    official sites before you book.{" "}
                    {rules.sources.map((u, i) => (
                      <span key={u}>
                        {i > 0 && ", "}
                        <a
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {host(u)}
                        </a>
                      </span>
                    ))}
                  </p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {cities.map((d) => (
                      <Link
                        key={d.slug}
                        href={`/destinations/${d.slug}/before`}
                        className="font-medium text-accent hover:underline"
                      >
                        {d.name} before-you-go tips →
                      </Link>
                    ))}
                  </p>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </>
  );
}

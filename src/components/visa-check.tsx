"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { BadgeCheck, CircleAlert, Stamp } from "lucide-react";
import { PASSPORTS, visaStatusLabel, type CountryVisa, type VisaStatus } from "@/lib/visa";

const usePassportStore = create<{ passport: string; set: (p: string) => void }>()(
  persist((set) => ({ passport: "", set: (passport) => set({ passport }) }), {
    name: "roamconsensus-passport",
    storage: createJSONStorage(() => localStorage),
    skipHydration: true,
  }),
);

const subscribe = (cb: () => void) => {
  const unsubHydrate = usePassportStore.persist.onFinishHydration(cb);
  const unsub = usePassportStore.subscribe(cb);
  if (!usePassportStore.persist.hasHydrated()) void usePassportStore.persist.rehydrate();
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
  VISA_FREE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  HOME: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  VISA_ON_ARRIVAL: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  E_VISA: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  VISA_REQUIRED: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export function PassportPicker() {
  const [passport, setPassport] = usePassport();
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <Stamp className="size-4 text-accent" aria-hidden />
      <span className="font-medium">My passport</span>
      <select
        value={passport}
        onChange={(e) => setPassport(e.target.value)}
        className="rounded-lg border border-line bg-background px-2 py-1.5"
      >
        <option value="">Choose…</option>
        {PASSPORTS.map((p) => (
          <option key={p} value={p}>
            {p}
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
  const Icon = rule && (rule.status === "VISA_FREE" || rule.status === "HOME") ? BadgeCheck : CircleAlert;

  return (
    <div>
      {!passport ? (
        <p className="text-sm text-muted">Choose your passport to see the rules for {country}.</p>
      ) : !rule ? (
        <p className="text-sm text-muted">No data for a {passport} passport yet. Check the official links below.</p>
      ) : (
        <div className={`rounded-xl border p-3 ${tone[rule.status]}`}>
          <p className="flex items-center gap-2 font-medium">
            <Icon className="size-4" aria-hidden />
            {visaStatusLabel[rule.status]}
            {rule.days && rule.status !== "HOME" && <span className="font-normal">· up to {rule.days} days</span>}
          </p>
          {rule.note && <p className="mt-1 text-sm text-foreground/80">{rule.note}</p>}
        </div>
      )}
      {!compact && (
        <>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {rules.common.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Checked {rules.checked}. Rules change: confirm on the official sites before you book.{" "}
            {rules.sources.map((u, i) => (
              <span key={u}>
                {i > 0 && ", "}
                <a href={u} target="_blank" rel="noopener noreferrer" className="underline">
                  {host(u)}
                </a>
              </span>
            ))}
          </p>
        </>
      )}
    </div>
  );
}

"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CURRENCIES, convertCents, FALLBACK_RATES, type Rates } from "@/lib/currency";
import { formatMoney } from "@/lib/format";

const useCurrencyStore = create<{ code: string; set: (code: string) => void }>()(
  persist((set) => ({ code: "USD", set: (code) => set({ code }) }), {
    name: "roamconsensus-currency",
    storage: createJSONStorage(() => localStorage),
    skipHydration: true,
  }),
);

const subscribe = (cb: () => void) => {
  const unsubHydrate = useCurrencyStore.persist.onFinishHydration(cb);
  const unsub = useCurrencyStore.subscribe(cb);
  if (!useCurrencyStore.persist.hasHydrated()) void useCurrencyStore.persist.rehydrate();
  return () => {
    unsubHydrate();
    unsub();
  };
};

/** The traveller's currency, or null before it has loaded (server render), when prices show as stored. */
function useCurrencyCode() {
  return useSyncExternalStore(
    subscribe,
    () => (useCurrencyStore.persist.hasHydrated() ? useCurrencyStore.getState().code : null),
    () => null,
  );
}

const RatesContext = createContext<Rates>(FALLBACK_RATES);

export function CurrencyProvider({ rates, children }: { rates: Rates; children: ReactNode }) {
  return <RatesContext.Provider value={rates}>{children}</RatesContext.Provider>;
}

type Priced = { priceCents: number | null; quantity: number; currency?: string; priceNote?: string | null };

/** Formatters in the traveller's chosen currency. */
export function useMoney() {
  const code = useCurrencyCode();
  const rates = useContext(RatesContext);
  const money = (cents: number, from = "USD") => {
    const c = convertCents(cents, from, code ?? from, rates);
    // Converted rupiah and won to the nearest thousand, yen to the nearest ten: "IDR 6,616,007" reads as false
    // precision.
    const rate = c.currency !== from ? (rates[c.currency] ?? 1) : 1;
    const step = rate > 1000 ? 100_000 : rate > 100 ? 1_000 : 1;
    return formatMoney(Math.round(c.cents / step) * step, c.currency);
  };
  return {
    code: code ?? "USD",
    /** True once prices may differ from how they are stored. */
    converting: code !== null,
    money,
    /** Same wording as formatPrice: total when known, else the creator's wording. */
    price: (i: Priced) => {
      if (i.priceCents === null) return i.priceNote ?? "Price not listed";
      if (i.priceCents === 0) return "Free";
      return money(i.priceCents * i.quantity, i.currency);
    },
    /** USD cents shown as a plain number in the chosen currency, for inputs. */
    toLocal: (usdCents: number) => convertCents(usdCents, "USD", code ?? "USD", rates).cents / 100,
    fromLocal: (amount: number) => convertCents(Math.round(amount * 100), code ?? "USD", "USD", rates).cents,
  };
}

export function Money({ cents, currency = "USD" }: { cents: number; currency?: string }) {
  return <>{useMoney().money(cents, currency)}</>;
}

export function Price({ item }: { item: Priced }) {
  return <>{useMoney().price(item)}</>;
}

export function CurrencyPicker() {
  const code = useCurrencyCode();
  const set = useCurrencyStore((s) => s.set);
  return (
    <select
      value={code ?? "USD"}
      onChange={(e) => set(e.target.value)}
      aria-label="Show prices in"
      title="Prices are converted at today's rate. You pay in the seller's currency."
      className="rounded-md border border-line bg-background px-1.5 py-0.5 text-sm text-foreground"
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code}
        </option>
      ))}
    </select>
  );
}

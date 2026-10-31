"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Tier } from "@/generated/prisma/enums";

/** The traveller's own travel profile from My trips. Passport and currency live in their own stores. */
export type TravelPrefs = {
  /** Usual travel style; "" = any. */
  tier: Tier | "";
  /** Index into LENGTHS; 0 = any length. */
  length: number;
  /** City slugs they've already been to. */
  been: string[];
};

export const usePrefsStore = create<
  TravelPrefs & { update: (p: Partial<TravelPrefs>) => void; toggleBeen: (slug: string) => void }
>()(
  persist(
    (set) => ({
      tier: "",
      length: 0,
      been: [],
      update: (p) => set(p),
      toggleBeen: (slug) =>
        set((s) => ({ been: s.been.includes(slug) ? s.been.filter((b) => b !== slug) : [...s.been, slug] })),
    }),
    { name: "roamconsensus-prefs", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

const subscribe = (cb: () => void) => {
  const unsubHydrate = usePrefsStore.persist.onFinishHydration(cb);
  const unsub = usePrefsStore.subscribe(cb);
  if (!usePrefsStore.persist.hasHydrated()) void usePrefsStore.persist.rehydrate();
  return () => {
    unsubHydrate();
    unsub();
  };
};

const none: TravelPrefs & { ready: false } = { tier: "", length: 0, been: [], ready: false };
let last: (TravelPrefs & { ready: boolean }) | null = null;

/** The saved profile once it has loaded from this device; defaults (ready: false) during the server render. */
export function usePrefs() {
  return useSyncExternalStore(
    subscribe,
    () => {
      const s = usePrefsStore.getState();
      const ready = usePrefsStore.persist.hasHydrated();
      if (!last || last.tier !== s.tier || last.length !== s.length || last.been !== s.been || last.ready !== ready)
        last = { tier: s.tier, length: s.length, been: s.been, ready };
      return last;
    },
    () => none,
  );
}

"use client";

import { create } from "zustand";

/** Hearted places of the signed-in traveller, as "<city slug>/<place slug>". Loaded by AccountSync. */
type FavouritesState = {
  /** True once the site has Google sign-in turned on. */
  enabled: boolean;
  signedIn: boolean;
  keys: Set<string>;
  toggle: (destination: string, place: string) => Promise<void>;
};

export const favouriteKey = (destination: string, place: string) => `${destination}/${place}`;

export const useFavourites = create<FavouritesState>()((set, get) => ({
  enabled: false,
  signedIn: false,
  keys: new Set(),
  toggle: async (destination, place) => {
    const key = favouriteKey(destination, place);
    const had = get().keys.has(key);
    const flip = (on: boolean) =>
      set((s) => {
        const keys = new Set(s.keys);
        if (on) keys.add(key);
        else keys.delete(key);
        return { keys };
      });
    flip(!had); // show the change straight away; undo it if the server says no
    const res = await fetch(
      had ? `/api/account/favourites?${new URLSearchParams({ destination, place })}` : "/api/account/favourites",
      had
        ? { method: "DELETE" }
        : {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ destination, place }),
          },
    ).catch(() => null);
    if (!res?.ok) flip(had);
  },
}));

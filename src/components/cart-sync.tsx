"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { type CartData, mergeCarts } from "@/lib/cart-data";
import { cleanCart, EMPTY_CART, useCart, useCartHydrated } from "@/lib/cart-store";
import { favouriteKey, useFavourites } from "@/lib/favourites";
import { type TravelPrefs, usePrefsStore } from "@/lib/prefs";
import { useCurrencyStore } from "@/components/money";
import { usePassportStore } from "@/components/visa-check";

// Which account this device's cart already follows. Set after the first sign-in here merges the two carts; from
// then on the account's copy is the latest, since every change is sent to it.
const SYNCED_KEY = "roamconsensus-cart-sync";

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
};

export function cartData(): CartData {
  const { items, budgetCents, tripDays, packed, startDate, done } = useCart.getState();
  return { items, budgetCents, tripDays, packed, startDate, done };
}

// Holds the account id while this device has trip changes the account hasn't confirmed saving (a dropped connection,
// a closed tab). While it is set, this device's copy is the newer one and must not be replaced by the account's.
const UNSAVED_KEY = "roamconsensus-cart-unsaved";

// Set while signing out, so the sync below doesn't send the emptied device cart to the account. Signing in again
// goes through Google and reloads the page, which starts this module fresh.
let leaving = false;
// True once this device's cart and the account's have been joined; before that the device copy may be older than the
// account's and must never be sent over it.
let inSync = false;
// The account the sync below is running for, so signing out can check that account holds the trip.
let signedInAs: string | null = null;
// True while the sync itself changes the cart (loading the account's copy), which is not a change by the traveller.
let applying = false;

type Pushed = "ok" | "refused" | "failed";

/** Sends the cart to the account. "refused": the server won't take it, so trying again won't help. "failed": no answer. */
async function push(data: CartData, keepalive = false): Promise<Pushed> {
  const res = await fetch("/api/account/cart", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data }),
    keepalive,
  }).catch(() => null);
  if (!res || res.status >= 500 || res.status === 429) return "failed";
  return res.ok ? "ok" : "refused";
}

/**
 * Joins this device's cart with the account's and leaves both the same. The first sign-in on a device merges the two;
 * after that the account's copy is the latest, unless this device still has changes that never reached it.
 * "saved": the account holds what this device shows. "unsaved": it doesn't yet. "unreachable": couldn't ask.
 */
async function joinAccount(userId: string, cancelled: () => boolean): Promise<"saved" | "unsaved" | "unreachable"> {
  const res = await fetch("/api/account/cart").catch(() => null);
  if (!res?.ok || cancelled()) return "unreachable";
  const { data: raw } = (await res.json()) as { data: CartData | null };
  const account = raw && cleanCart(raw);
  const device = cartData();
  const followed = read(SYNCED_KEY) === userId;
  const unsaved = read(UNSAVED_KEY) === userId;
  const next = !account ? device : followed ? (unsaved ? device : account) : mergeCarts(device, account);
  applying = true;
  useCart.setState(next);
  applying = false;
  write(SYNCED_KEY, userId);
  // Compared with the cleaned copy: the database hands the saved cart back with its keys in another order.
  if (account && JSON.stringify(next) === JSON.stringify(account)) {
    write(UNSAVED_KEY, null);
    return "saved";
  }
  write(UNSAVED_KEY, userId);
  if ((await push(next)) !== "ok") return "unsaved";
  if (JSON.stringify(cartData()) === JSON.stringify(next)) write(UNSAVED_KEY, null);
  return "saved";
}

/**
 * Signs out and takes the trip off this device. The account keeps its copy, so signing in again brings it back; left
 * behind, it would be merged into whichever account signs in here next (a shared or borrowed computer). The trip is
 * only removed once the account is known to hold it, or the traveller says to sign out anyway.
 */
export async function signOutHere() {
  const userId = signedInAs;
  let saved = true;
  if (userId && inSync) {
    // Last changes first, or an edit made in the final second would be lost with the device copy.
    saved = (await push(cartData())) === "ok";
  } else if (userId) {
    saved = (await joinAccount(userId, () => false)) === "saved";
  }
  if (
    !saved &&
    cartData().items.length > 0 &&
    !confirm(
      "We couldn't check that your trip is saved to your account (connection problem?). Sign out anyway? The trip will be removed from this device.",
    )
  )
    return false;
  leaving = true;
  const { error } = await authClient.signOut();
  if (error) {
    leaving = false;
    return false;
  }
  write(SYNCED_KEY, null);
  write(UNSAVED_KEY, null);
  useCart.setState(EMPTY_CART);
  usePrefsStore.getState().update({ tier: "", length: 0, been: [] });
  return true;
}

/** Keeps a signed-in traveller's trip cart the same on every device, and loads their ♥ places. Renders nothing. */
export function CartSync() {
  const hydrated = useCartHydrated();
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (isPending) return;
    useFavourites.setState({ enabled: true, signedIn: Boolean(userId), keys: new Set() });
    if (!userId) return;
    let stale = false;
    fetch("/api/account/favourites")
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => [])
      .then((rows: { destination: string; place: string }[]) => {
        if (!stale) useFavourites.setState({ keys: new Set(rows.map((r) => favouriteKey(r.destination, r.place))) });
      });
    return () => {
      stale = true;
    };
  }, [isPending, userId]);

  useEffect(() => {
    if (!hydrated || isPending) return;
    signedInAs = userId ?? null;
    if (!userId) {
      // Session ended without the Sign out button: the cart stays here and merges on the next sign-in.
      write(SYNCED_KEY, null);
      write(UNSAVED_KEY, null);
      return;
    }
    let ready = false;
    let cancelled = false;
    let busy = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    // The cart the account is known to hold.
    let last = "";

    const send = async (keepalive = false) => {
      clearTimeout(timer);
      if (leaving || !ready) return;
      const now = JSON.stringify(cartData());
      if (now === last) return write(UNSAVED_KEY, null);
      // One save at a time, so an older copy can't land after a newer one. Leaving the page can't wait its turn.
      if (busy && !keepalive) {
        timer = setTimeout(send, 800);
        return;
      }
      busy = true;
      const result = await push(JSON.parse(now), keepalive);
      busy = false;
      if (cancelled) return;
      if (result === "ok") {
        last = now;
        tries = 0;
        if (JSON.stringify(cartData()) === now) write(UNSAVED_KEY, null);
        else timer = setTimeout(send, 800);
      } else if (result === "failed" && tries < 8) {
        // No answer (signal dropped, server busy): keep trying, a little slower each time.
        tries++;
        timer = setTimeout(send, Math.min(60_000, 1000 * 2 ** tries));
      }
    };

    // The account's cart can fail to load on a bad connection; without it nothing syncs, so ask again a few times.
    const load = async (attempt = 0) => {
      const result = await joinAccount(userId, () => cancelled);
      if (cancelled) return;
      if (result === "unreachable") {
        if (attempt < 5) loadTimer = setTimeout(() => void load(attempt + 1), 5000 * (attempt + 1));
        return;
      }
      last = result === "saved" ? JSON.stringify(cartData()) : "";
      ready = true;
      inSync = true;
      if (result === "unsaved") void send();
    };
    void load();

    const unsubscribe = useCart.subscribe(() => {
      if (applying || leaving) return;
      // Marked before anything is sent: if the save never arrives, the next visit keeps this device's copy.
      write(UNSAVED_KEY, userId);
      if (!ready) return;
      tries = 0;
      clearTimeout(timer);
      timer = setTimeout(send, 800);
    });
    const onHide = () => void send(true);
    const onOnline = () => {
      tries = 0;
      if (ready) void send();
      else {
        clearTimeout(loadTimer);
        void load();
      }
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("online", onOnline);
    return () => {
      void send(true);
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(loadTimer);
      unsubscribe();
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("online", onOnline);
      inSync = false;
    };
  }, [hydrated, isPending, userId]);

  usePrefsSync(isPending ? undefined : (userId ?? null));

  return null;
}

type AccountPrefs = { tier: string; length: number; been: string[]; passport: string; currency: string };

function prefsData(): AccountPrefs {
  const { tier, length, been } = usePrefsStore.getState();
  return { tier, length, been, passport: usePassportStore.getState().passport, currency: useCurrencyStore.getState().code };
}

const pushPrefs = (prefs: AccountPrefs) =>
  fetch("/api/account/prefs", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(prefs),
    keepalive: true,
  }).catch(() => {});

/** The travel profile (style, length, cities been, passport, currency) follows the account; the account's copy wins. */
function usePrefsSync(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId) return;
    let ready = false;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = "";

    (async () => {
      await Promise.all([
        usePrefsStore.persist.rehydrate(),
        usePassportStore.persist.rehydrate(),
        useCurrencyStore.persist.rehydrate(),
      ]);
      const res = await fetch("/api/account/prefs").catch(() => null);
      if (!res?.ok || cancelled) return;
      const { prefs } = (await res.json()) as { prefs: AccountPrefs | null };
      if (prefs) {
        usePrefsStore.getState().update({
          tier: prefs.tier as TravelPrefs["tier"],
          length: prefs.length,
          been: prefs.been,
        });
        if (prefs.passport) usePassportStore.getState().set(prefs.passport);
        if (prefs.currency) useCurrencyStore.getState().set(prefs.currency);
      }
      last = JSON.stringify(prefsData());
      if (!prefs) void pushPrefs(prefsData());
      ready = true;
    })();

    const changed = () => {
      if (!ready) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const now = JSON.stringify(prefsData());
        if (now === last) return;
        last = now;
        void pushPrefs(JSON.parse(now));
      }, 800);
    };
    const unsubs = [usePrefsStore.subscribe(changed), usePassportStore.subscribe(changed), useCurrencyStore.subscribe(changed)];
    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubs.forEach((u) => u());
    };
  }, [userId]);
}

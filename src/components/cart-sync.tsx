"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { type CartData, mergeCarts } from "@/lib/cart-data";
import { useCart, useCartHydrated } from "@/lib/cart-store";

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

const push = (data: CartData, keepalive = false) =>
  fetch("/api/account/cart", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data }),
    keepalive,
  }).catch(() => {});

/** Keeps a signed-in traveller's trip cart the same on every device. Renders nothing. */
export function CartSync() {
  const hydrated = useCartHydrated();
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (!hydrated || isPending) return;
    if (!userId) {
      write(SYNCED_KEY, null); // signed out: the cart stays on this device, and a later sign-in merges again
      return;
    }
    let ready = false;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = "";

    (async () => {
      const res = await fetch("/api/account/cart").catch(() => null);
      if (!res?.ok || cancelled) return;
      const { data: account } = (await res.json()) as { data: CartData | null };
      const device = cartData();
      const next = !account ? device : read(SYNCED_KEY) === userId ? account : mergeCarts(device, account);
      useCart.setState(next);
      write(SYNCED_KEY, userId);
      last = JSON.stringify(next);
      if (last !== JSON.stringify(account)) void push(next);
      ready = true;
    })();

    const send = (keepalive = false) => {
      clearTimeout(timer);
      const now = JSON.stringify(cartData());
      if (now === last) return;
      last = now;
      void push(JSON.parse(now), keepalive);
    };
    const unsubscribe = useCart.subscribe(() => {
      if (!ready) return;
      clearTimeout(timer);
      timer = setTimeout(send, 800);
    });
    const onHide = () => ready && send(true);
    window.addEventListener("pagehide", onHide);
    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener("pagehide", onHide);
      if (ready) send(true);
    };
  }, [hydrated, isPending, userId]);

  return null;
}

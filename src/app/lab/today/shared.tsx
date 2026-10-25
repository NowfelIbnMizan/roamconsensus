"use client";

import { useState } from "react";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { planLength } from "@/components/day-plan";
import { cityOf } from "@/lib/trip";
import { dayLegs, hasPin } from "@/lib/map";

export const directionsUrl = (p: { lat: number; lng: number }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

/** Lab: the same plan maths Trip mode uses, so each mockup only differs in layout. */
export function useToday() {
  const hydrated = useCartHydrated();
  const cart = useCart();
  const days = planLength(cart.items, cart.tripDays);
  const [day, setDay] = useState(1);
  const list = cart.items.filter((i) => i.day === day);
  const city = cityOf(list) ?? cityOf(cart.items);
  const pinned = list.filter(hasPin);
  const { legs } = dayLegs(pinned);
  const next = list.find((i) => !cart.done.includes(i.id));
  const doneCount = list.filter((i) => cart.done.includes(i.id)).length;
  return { hydrated, ...cart, days, day, setDay, list, city, pinned, legs, next, doneCount };
}
export type Today = ReturnType<typeof useToday>;

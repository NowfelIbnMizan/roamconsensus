"use client";

import { useCart, useCartHydrated } from "@/lib/cart-store";
import { planLength } from "@/components/day-plan";
import { tripDayToday } from "@/lib/trip";

/** Today's day number while the saved trip is under way, else null (also before the cart loads). */
export function useTripDay() {
  const hydrated = useCartHydrated();
  const { items, tripDays, startDate } = useCart();
  if (!hydrated || items.length === 0) return null;
  return tripDayToday(startDate, planLength(items, tripDays));
}

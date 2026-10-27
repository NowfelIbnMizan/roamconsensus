"use client";

import Link from "next/link";
import { Luggage, Sun } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { useTripDay } from "@/lib/use-trip-day";

export function CartLink() {
  const hydrated = useCartHydrated();
  const count = useCart((s) => s.items.length);
  const today = useTripDay();

  return (
    <>
      {today && (
        <Link
          href="/today"
          aria-label={`Trip mode: day ${today} of your trip`}
          className="hidden items-center gap-1.5 rounded-full bg-accent px-3 py-1 font-medium whitespace-nowrap text-background sm:flex"
        >
          <Sun className="size-4" aria-hidden />
          <span className="hidden lg:inline">Today</span>
        </Link>
      )}
      <Link
        href="/cart"
        aria-label="Trip plan"
        className="relative flex items-center gap-1.5 rounded-full border border-line px-3 py-1 whitespace-nowrap"
      >
        <Luggage className="size-4" aria-hidden />
        <span className="hidden lg:inline">Trip plan</span>
        {hydrated && count > 0 && (
          <span className="ml-0.5 rounded-full bg-accent px-1.5 text-xs font-medium text-background">{count}</span>
        )}
      </Link>
    </>
  );
}

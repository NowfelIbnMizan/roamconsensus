"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddItemButton } from "@/components/add-to-cart";
import { Thumb } from "@/components/thumb";
import type { CartItem } from "@/lib/cart-store";
import { distanceKm, hasPin } from "@/lib/map";
import { placeHref } from "@/lib/place";

type Stay = {
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
  creators: number;
  photoUrl: string | null;
  cartItem: CartItem;
};

const PICKS = 3;
const NEAR_KM = 15;
const loaded = new Map<string, Promise<Stay[]>>();
const stays = (city: string) => {
  if (!loaded.has(city))
    loaded.set(
      city,
      fetch(`/api/cart/stays?city=${encodeURIComponent(city)}`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    );
  return loaded.get(city)!;
};

/** A city in the plan with no hotel: creators' hotel picks near that day's stops, from the site's own routes. */
export function StayPicks({ city, day, list }: { city: string; day: number; list: CartItem[] }) {
  const [all, setAll] = useState<Stay[] | null>(null);
  useEffect(() => {
    let live = true;
    stays(city).then((s) => live && setAll(s));
    return () => {
      live = false;
    };
  }, [city]);
  if (!all) return null;

  const pins = list.filter(hasPin);
  const picks = all
    .map((s) => ({
      ...s,
      km: pins.length && hasPin(s) ? Math.min(...pins.map((p) => distanceKm(p, s))) : null,
    }))
    // No pins that day: the city's best-loved hotels; otherwise only ones nearby.
    .filter((s) => (pins.length ? s.km !== null && s.km <= NEAR_KM : true))
    .sort((a, b) => b.creators - a.creators || (a.km ?? 0) - (b.km ?? 0))
    .slice(0, PICKS);
  if (!picks.length) return null;

  return (
    <div className="border-t border-dashed border-line bg-background/60 px-4 py-3">
      <p className="eyebrow">No hotel yet</p>
      <p className="fine-print mt-0.5">Hotels creators on Creatour recommend near this day&apos;s stops.</p>
      <ul className="mt-2 space-y-1">
        {picks.map((s) => (
          <li key={s.slug} className="flex items-center gap-3 py-1">
            <Thumb url={s.photoUrl} alt={s.name} category="STAY" className="size-10 shrink-0 rounded-lg" />
            <span className="min-w-0 flex-1">
              <Link
                href={placeHref(city, s.slug)}
                className="block truncate text-sm font-medium hover:text-accent hover:underline"
              >
                {s.name}
              </Link>
              <span className="block truncate text-xs text-muted">
                {s.creators} {s.creators === 1 ? "creator" : "creators"}
                {s.km !== null && ` · ${s.km < 1 ? "under 1" : Math.round(s.km)} km away`}
              </span>
            </span>
            <span className="shrink-0">
              <AddItemButton item={{ ...s.cartItem, day, photoUrl: s.photoUrl }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

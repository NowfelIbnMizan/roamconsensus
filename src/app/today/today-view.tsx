"use client";

import { StopNote } from "@/components/stop-note";
import { Luggage } from "lucide-react";
import { PageGuide } from "@/components/page-guide";
import Link from "next/link";
import { Thumb } from "@/components/thumb";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, CloudRain, ExternalLink, Navigation, Plus } from "lucide-react";
import { lineTotal, useCart, useCartHydrated, type CartItem } from "@/lib/cart-store";
import { planLength } from "@/components/day-plan";
import { LegHint } from "@/components/road-time";
import { WeatherCard } from "@/components/weather-card";
import { useMoney } from "@/components/money";
import { categoryLabel } from "@/lib/format";
import { cityOf } from "@/lib/trip";
import { dayLegs, googleMapsRouteUrl, hasPin } from "@/lib/map";
import type { Weather } from "@/lib/weather";
import type { ItemCategory } from "@/generated/prisma/enums";

type RainyPick = {
  name: string;
  area: string | null;
  category: ItemCategory;
  href: string;
  cartItem: CartItem | null;
};
type CityInfo = { weather: Weather | null; rainyPicks: RainyPick[] };

const DAY_MS = 86_400_000;
const localToday = () => {
  const d = new Date();
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
};

/** Which trip day today is, from the start date; null before the trip starts, after it ends, or with no date. */
function tripDayToday(startDate: string | null, days: number) {
  if (!startDate) return null;
  const n = Math.floor((localToday() - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS) + 1;
  return n >= 1 && n <= days ? n : null;
}

const directionsUrl = (p: { lat: number; lng: number }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

export function TodayView() {
  const hydrated = useCartHydrated();
  const { items, tripDays, startDate, setStartDate, done, toggleDone, add, setDay } = useCart();
  const { price } = useMoney();
  const days = planLength(items, tripDays);
  const auto = tripDayToday(startDate, days);
  const [picked, setPicked] = useState<number | null>(null);
  const day = picked ?? auto ?? 1;
  const list = items.filter((i) => i.day === day);
  const city = cityOf(list) ?? cityOf(items);
  const [info, setInfo] = useState<{ slug: string; data: CityInfo } | null>(null);

  useEffect(() => {
    if (!city || info?.slug === city.slug) return;
    fetch(`/api/today?city=${encodeURIComponent(city.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setInfo({ slug: city.slug, data }))
      .catch(() => {}); // offline: the plan still shows, just without weather
  }, [city, info?.slug]);

  if (!hydrated) return <p className="text-muted">Loading your trip…</p>;
  if (items.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-line p-10 text-center">
        <Luggage className="mx-auto mb-3 size-10 text-muted" strokeWidth={1.25} aria-hidden />
        <p className="font-medium">No trip planned yet.</p>
        <p className="mt-1 text-sm text-muted">Add a route to your trip cart, then come back here while you travel.</p>
        <Link href="/#destinations" className="mt-4 inline-block text-sm font-medium text-accent underline">
          Browse destinations
        </Link>
      </div>
    );

  const pinned = list.filter(hasPin);
  const { legs } = dayLegs(pinned);
  const next = list.find((i) => !done.includes(i.id));
  const data = info?.slug === city?.slug ? info?.data : null;
  const forecast =
    data?.weather?.days.find((d) => d.date === new Date().toISOString().slice(0, 10)) ?? data?.weather?.days[0];
  const rainy =
    data?.weather &&
    (["Rain", "Thunderstorm", "Drizzle"].includes(data.weather.now.main) || (forecast?.rainChance ?? 0) >= 60);
  const inPlan = new Set(items.map((i) => i.id));

  return (
    <>
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPicked(Math.max(1, day - 1))}
            disabled={day === 1}
            aria-label="Previous day"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line disabled:opacity-30"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm text-muted">
              {auto === day ? "Today" : "Trip mode"}
              {city && ` · ${city.name}`}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Day {day} of {days}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setPicked(Math.min(days, day + 1))}
            disabled={day === days}
            aria-label="Next day"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line disabled:opacity-30"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
        <label className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
          Trip starts
          <input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => {
              setStartDate(e.target.value || null);
              setPicked(null);
            }}
            className="rounded-lg border border-line bg-background px-2 py-1 text-foreground"
          />
        </label>
        <PageGuide id="today" className="mt-4" />
        {!startDate && (
          <p className="mt-2 text-xs text-muted">
            Set your start date and this page opens on today&apos;s plan by itself.
          </p>
        )}

        <div className="mt-6">{data?.weather && city && <WeatherCard name={city.name} weather={data.weather} />}</div>

        {rainy && data && data.rainyPicks.length > 0 && (
          <section className="mb-6 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <CloudRain className="size-5 text-sky-700 dark:text-sky-400" aria-hidden /> Rainy day? Indoor backups
            </h2>
            <p className="mt-1 text-sm text-muted">Spots under a roof that creators recommend in {city?.name}.</p>
            <ul className="mt-3 divide-y divide-line">
              {data.rainyPicks.map((p) => (
                <li key={p.href} className="flex items-center justify-between gap-3 py-2">
                  <Link href={p.href} className="min-w-0 hover:underline">
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-xs text-muted">
                      {[p.area, categoryLabel[p.category]].filter(Boolean).join(" · ")}
                    </span>
                  </Link>
                  {p.cartItem &&
                    (inPlan.has(p.cartItem.id) ? (
                      <span className="text-xs text-muted">In your plan</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          add([{ ...p.cartItem!, day: null }]);
                          setDay(p.cartItem!.id, day);
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium"
                      >
                        <Plus className="size-3" aria-hidden /> Add to day {day}
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          </section>
        )}

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">
            Nothing planned for day {day}. A free day!{" "}
            <Link href="/cart" className="text-accent underline">
              Plan it in your trip cart
            </Link>
          </p>
        ) : (
          <>
            {next ? (
              <section className="overflow-hidden rounded-3xl border border-accent bg-card">
                <Thumb
                  url={next.photoUrl}
                  category={next.category}
                  sizes="(min-width: 640px) 576px, 100vw"
                  className="aspect-[16/10] w-full"
                />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">Up next</p>
                  <h2 className="mt-1 text-2xl font-semibold leading-tight">{next.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {categoryLabel[next.category]}
                    {lineTotal(next) > 0 && ` · ${price(next)}`}
                    {next.couponCode && (
                      <span className="ml-2 rounded border border-dashed border-accent px-1 font-mono text-accent">
                        {next.couponCode}
                      </span>
                    )}
                  </p>
                  <StopNote id={next.id} note={next.note} editable={false} />
                  <LegHint leg={legs.get(next.id)} />
                  <div className="mt-4 flex gap-2">
                    {hasPin(next) && (
                      <a
                        href={directionsUrl(next)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-lg font-semibold text-background"
                      >
                        <Navigation className="size-5" aria-hidden /> Directions
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleDone(next.id)}
                      className={`flex items-center justify-center gap-2 rounded-2xl border border-line px-5 py-4 font-medium ${hasPin(next) ? "" : "flex-1"}`}
                    >
                      <Check className="size-5" aria-hidden /> Done
                    </button>
                  </div>
                  {(next.bookUrl ?? next.website) && (
                    <a
                      href={(next.bookUrl ?? next.website)!}
                      target="_blank"
                      rel={next.bookUrl ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                    >
                      {next.bookUrl ? (next.vendor ? `Book on ${next.vendor}` : "Book") : "Website"}
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  )}
                </div>
              </section>
            ) : (
              <p className="rounded-3xl border border-accent bg-accent-soft p-6 text-center font-medium text-accent">
                All {list.length} stops done. Nice day!
              </p>
            )}

            <h2 className="mt-6 text-sm font-medium text-muted">
              {next ? "Rest of the day" : `Day ${day}`} · {list.filter((i) => done.includes(i.id)).length} of{" "}
              {list.length} done
            </h2>
            <ol className="mt-2 divide-y divide-line rounded-2xl border border-line bg-card">
              {list
                .filter((i) => i.id !== next?.id)
                .map((item) => {
                  const isDone = done.includes(item.id);
                  return (
                    <li key={item.id} className="flex items-center gap-3 p-3">
                      <button
                        type="button"
                        onClick={() => toggleDone(item.id)}
                        aria-pressed={isDone}
                        aria-label={isDone ? `Mark ${item.name} not done` : `Mark ${item.name} done`}
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                          isDone ? "border-accent bg-accent text-background" : "border-line"
                        }`}
                      >
                        {isDone && <Check className="size-4" aria-hidden />}
                      </button>
                      <span className={`min-w-0 flex-1 ${isDone ? "text-muted line-through" : ""}`}>
                        <span className="block truncate">{item.name}</span>
                        {!isDone && (
                          <span className="text-xs text-muted">
                            {categoryLabel[item.category]}
                            {lineTotal(item) > 0 && ` · ${price(item)}`}
                          </span>
                        )}
                      </span>
                      <Thumb url={item.photoUrl} category={item.category} className="size-11 shrink-0 rounded-lg" />
                    </li>
                  );
                })}
            </ol>
            {pinned.length > 1 && (
              <a
                href={googleMapsRouteUrl(pinned)!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                Whole day&apos;s route in Google Maps <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </>
        )}
        <p className="mt-8 text-xs text-muted">
          Works offline once opened: your plan is saved on this phone. Edit it in your{" "}
          <Link href="/cart" className="underline">
            trip cart
          </Link>
          .
        </p>
      </div>
    </>
  );
}

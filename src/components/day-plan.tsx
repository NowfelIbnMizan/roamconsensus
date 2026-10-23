"use client";

import { Thumb } from "@/components/thumb";
import Link from "next/link";
import { StopNote } from "@/components/stop-note";
import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, Minus, Plane, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/cart-store";
import { categoryLabel } from "@/lib/format";
import { dayColor, dayLegs, googleMapsPinUrl, googleMapsRouteUrl, hasPin } from "@/lib/map";
import { DriveSummary, LegHint } from "@/components/road-time";
import { useMoney } from "@/components/money";
import type { MapGroup, MapStop } from "@/components/trip-map";
import { cityOf } from "@/lib/trip";
import { transferHint, transferLinks } from "@/lib/transfer";

const UNPLANNED = "#a8a29e";

/** Days in the plan: the length the traveller set, or as many as their planned items use. */
export function planLength(items: CartItem[], tripDays: number) {
  return Math.max(1, tripDays || Math.max(0, ...items.map((i) => i.day ?? 0)));
}

const inDay = (items: CartItem[], day: number | null, days: number) =>
  items.filter((i) => (day === null ? !i.day || i.day > days : i.day === day));

/** Map pins and day chips for a plan: numbered per day like an itinerary, unplanned stops in grey. */
export function planMap(items: CartItem[], days: number) {
  const stops: MapStop[] = [];
  const groups: MapGroup[] = [];
  for (let d = 1; d <= days; d++) {
    const pinned = inDay(items, d, days).filter(hasPin);
    pinned.forEach((i, n) =>
      stops.push({
        key: i.id,
        lat: i.lat,
        lng: i.lng,
        label: String(n + 1),
        color: dayColor(d - 1),
        title: i.name,
        subtitle: `Day ${d} · ${categoryLabel[i.category]}`,
        href: googleMapsPinUrl(i),
        group: d,
      }),
    );
    if (pinned.length)
      groups.push({ id: d, label: `Day ${d}`, color: dayColor(d - 1), routeUrl: googleMapsRouteUrl(pinned) });
  }
  for (const i of inDay(items, null, days).filter(hasPin))
    stops.push({
      key: i.id,
      lat: i.lat,
      lng: i.lng,
      label: "?",
      color: UNPLANNED,
      title: i.name,
      subtitle: "Not planned yet",
      href: googleMapsPinUrl(i),
    });
  return { stops, groups };
}

type Edit = {
  setDay: (id: string, day: number | null) => void;
  move: (id: string, dir: -1 | 1) => void;
  place: (id: string, day: number | null, before: string | null) => void;
  remove: (id: string) => void;
  setTripDays: (days: number) => void;
};

/** Between two days in different cities: how far apart they are and where to book the trip between them. */
function TravelDay({ from, to }: { from: { name: string; last?: CartItem }; to: { name: string; first?: CartItem } }) {
  const hint = transferHint(
    from.last && hasPin(from.last) ? from.last : null,
    to.first && hasPin(to.first) ? to.first : null,
  );
  return (
    <section className="rounded-2xl border border-dashed border-accent/50 bg-accent-soft/40 px-4 py-3">
      <h3 className="flex items-center gap-2 font-semibold">
        <Plane className="size-4 text-accent" aria-hidden /> {from.name} to {to.name}
      </h3>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint.text}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {transferLinks(from, to).map((l) => (
          <a
            key={l.site}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium hover:border-accent"
          >
            {l.label} · {l.site} <ExternalLink className="size-3" aria-hidden />
          </a>
        ))}
      </div>
    </section>
  );
}

/** The traveller's own day-by-day plan. Read-only without `edit` (a shared trip). */
type DropTarget = { day: number | null; before: string | null };

/**
 * Drag a stop by its grip to another spot or day. Pointer events (not HTML drag and drop) so it works with touch;
 * the grip has touch-action: none, so the rest of the row still scrolls the page.
 */
function useDragStop(place: Edit["place"] | undefined) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);

  const targetAt = (x: number, y: number): DropTarget | null => {
    const el = document.elementFromPoint(x, y);
    const day = (v: string | undefined) => (v ? Number(v) : null);
    const row = el?.closest<HTMLElement>("[data-drop-id]");
    if (row) {
      const { top, height } = row.getBoundingClientRect();
      const upper = y < top + height / 2;
      return { day: day(row.dataset.dropDay), before: upper ? row.dataset.dropId! : row.dataset.dropNext || null };
    }
    const section = el?.closest<HTMLElement>("[data-drop-section]");
    return section ? { day: day(section.dataset.dropDay), before: null } : null;
  };

  const grip = (id: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(id);
      setTarget(null);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (dragging !== id) return;
      setTarget(targetAt(e.clientX, e.clientY));
      // Scroll while holding near the top or bottom edge (above the phone tab bar).
      if (e.clientY < 80) window.scrollBy(0, -14);
      else if (e.clientY > window.innerHeight - 110) window.scrollBy(0, 14);
    },
    onPointerUp: () => {
      if (dragging && target && place) place(dragging, target.day, target.before);
      setDragging(null);
      setTarget(null);
    },
    onPointerCancel: () => {
      setDragging(null);
      setTarget(null);
    },
  });

  return { dragging, target, grip };
}

export function DayPlan({ items, days, edit }: { items: CartItem[]; days: number; edit?: Edit }) {
  const { price } = useMoney();
  const { dragging, target, grip } = useDragStop(edit?.place);
  const sections: { day: number | null; list: CartItem[] }[] = [
    ...Array.from({ length: days }, (_, n) => ({ day: n + 1, list: inDay(items, n + 1, days) })),
    { day: null, list: inDay(items, null, days) },
  ];

  return (
    <div className="space-y-4">
      {edit && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">Trip length</span>
          <button
            type="button"
            onClick={() => edit.setTripDays(days - 1)}
            disabled={days <= 1}
            aria-label="One day fewer"
            className="flex size-7 items-center justify-center rounded-full border border-line disabled:opacity-40"
          >
            <Minus className="size-3" aria-hidden />
          </button>
          <span className="w-14 text-center font-medium tabular-nums">
            {days} day{days > 1 && "s"}
          </span>
          <button
            type="button"
            onClick={() => edit.setTripDays(days + 1)}
            aria-label="One more day"
            className="flex size-7 items-center justify-center rounded-full border border-line"
          >
            <Plus className="size-3" aria-hidden />
          </button>
        </div>
      )}
      {sections.map(({ day, list }, n) => {
        if (day === null && list.length === 0) return null;
        const city = day === null ? null : cityOf(list);
        // The last earlier day with stops, to spot a change of city.
        const before = sections.slice(0, n).findLast((x) => x.day !== null && x.list.length > 0);
        const prevCity = before ? cityOf(before.list) : null;
        const moved = city && prevCity && city.slug !== prevCity.slug;
        const pinned = list.filter(hasPin);
        const { legs, total } = dayLegs(pinned);
        const routeUrl = pinned.length > 1 ? googleMapsRouteUrl(pinned) : null;
        let pin = 0;
        return (
          <div key={day ?? "unplanned"} className="space-y-4">
            {moved && before && (
              <TravelDay
                from={{ name: prevCity.name, last: before.list.findLast(hasPin) }}
                to={{ name: city.name, first: list.find(hasPin) }}
              />
            )}
            <section
              data-drop-section
              data-drop-day={day ?? ""}
              className={`rounded-2xl border bg-card transition ${
                dragging && target?.day === day && target.before === null
                  ? "border-accent ring-2 ring-accent/40"
                  : "border-line"
              }`}
            >
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
                <h3 className="flex flex-wrap items-center gap-2 font-semibold">
                  {day === null ? "Not planned yet" : `Day ${day}`}
                  {city &&
                    sections.some(
                      (x) => x.day !== null && x.list.some((i) => i.destination && i.destination.slug !== city.slug),
                    ) && <span className="font-normal text-muted">· {city.name}</span>}
                  {day !== null && <DriveSummary minutes={total} />}
                </h3>
                {routeUrl && (
                  <a
                    href={routeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                  >
                    Route in Google Maps <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </header>
              {list.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">
                  Free day{edit && ". Pick this day on any item to move it here"}.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {list.map((item, n) => {
                    const number = hasPin(item) ? ++pin : null;
                    return (
                      <li
                        key={item.id}
                        data-drop-id={item.id}
                        data-drop-day={day ?? ""}
                        data-drop-next={list[n + 1]?.id ?? ""}
                        className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${
                          dragging === item.id ? "opacity-40" : ""
                        } ${dragging && target?.before === item.id && dragging !== item.id ? "shadow-[inset_0_3px_0_var(--accent)]" : ""}`}
                      >
                        <div className="flex min-w-0 flex-1 basis-56 gap-3">
                          {edit && (
                            <button
                              type="button"
                              {...grip(item.id)}
                              aria-label={`Drag ${item.name} to another spot or day`}
                              title="Drag to move"
                              className="-ml-2 flex w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted hover:text-foreground active:cursor-grabbing"
                            >
                              <GripVertical className="size-4" aria-hidden />
                            </button>
                          )}
                          <Thumb
                            url={item.photoUrl}
                            category={item.category}
                            className="size-12 rounded-lg sm:size-14"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">
                              {number !== null && (
                                <span
                                  className="mr-2 inline-flex size-5 items-center justify-center rounded-full align-[1px] text-[11px] font-semibold text-white"
                                  style={{ background: day === null ? UNPLANNED : dayColor(day - 1) }}
                                >
                                  {day === null ? "?" : number}
                                </span>
                              )}
                              {item.name}
                            </p>
                            <p className="text-xs text-muted">
                              {categoryLabel[item.category]} · from{" "}
                              <Link href={`/itineraries/${item.itinerary.slug}`} className="underline">
                                {item.itinerary.title}
                              </Link>
                            </p>
                            {day !== null && <LegHint leg={legs.get(item.id)} />}
                            <StopNote id={item.id} note={item.note} editable={Boolean(edit)} />
                          </div>
                        </div>
                        <span className="text-sm tabular-nums text-muted">{price(item)}</span>
                        {edit && (
                          <div className="flex items-center gap-1">
                            <select
                              value={day ?? ""}
                              onChange={(e) => edit.setDay(item.id, e.target.value ? Number(e.target.value) : null)}
                              aria-label={`Day for ${item.name}`}
                              className="rounded-lg border border-line bg-background px-2 py-1 text-sm"
                            >
                              {Array.from({ length: days }, (_, d) => (
                                <option key={d} value={d + 1}>
                                  Day {d + 1}
                                </option>
                              ))}
                              <option value="">Not planned</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => edit.move(item.id, -1)}
                              disabled={n === 0}
                              aria-label={`Move ${item.name} earlier`}
                              className="flex size-7 items-center justify-center rounded-full text-muted hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronUp className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => edit.move(item.id, 1)}
                              disabled={n === list.length - 1}
                              aria-label={`Move ${item.name} later`}
                              className="flex size-7 items-center justify-center rounded-full text-muted hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronDown className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => edit.remove(item.id)}
                              aria-label={`Remove ${item.name}`}
                              className="ml-1 text-muted hover:text-rose-600"
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";

export type MapStop = {
  key: string;
  lat: number;
  lng: number;
  /** Text inside the pin, usually its number in the list. Grouped maps show the day instead until one is picked. */
  label: string;
  color: string;
  title: string;
  subtitle?: string;
  /** Google Maps link shown in the pin's popup. */
  href?: string;
  /** Our own page about the stop, linked from the popup. */
  page?: string;
  /** Day (or other group) the stop belongs to; groups get their own chip and route line. */
  group?: number;
  /** Category, so the consensus filter chips can hide the pin like its list row. */
  cat?: string;
  /** Cart item behind the pin: pins already in the traveller's cart get a ring. */
  cartId?: string;
};

export type MapGroup = { id: number; label: string; color: string; routeUrl?: string | null };

type MapHandle = { L: typeof Leaflet; map: Leaflet.Map; layer: Leaflet.LayerGroup };

const tiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function popup(s: MapStop) {
  const box = document.createElement("div");
  const title = box.appendChild(document.createElement("p"));
  title.className = "rc-popup-title";
  title.textContent = s.title;
  if (s.subtitle) {
    const sub = box.appendChild(document.createElement("p"));
    sub.className = "rc-popup-sub";
    sub.textContent = s.subtitle;
  }
  if (s.page) {
    const a = box.appendChild(document.createElement("a"));
    a.href = s.page;
    a.className = "rc-popup-link";
    a.textContent = "What creators say →";
    box.appendChild(document.createElement("br"));
  }
  if (s.href) {
    const a = box.appendChild(document.createElement("a"));
    a.href = s.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "rc-popup-link";
    a.textContent = "Open in Google Maps ↗";
  }
  return box;
}

/**
 * Free OpenStreetMap map (no API key) with numbered pins. Google Maps opens from the pin popups and route links,
 * since an embedded Google map needs a billed API key.
 */
export function TripMap({
  stops,
  groups = [],
  connect = false,
  legend = [],
  className = "h-72 sm:h-96",
}: {
  stops: MapStop[];
  groups?: MapGroup[];
  /** Draw a dashed line through each group's stops in order. */
  connect?: boolean;
  legend?: { label: string; color: string }[];
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const handle = useRef<MapHandle | null>(null);
  const fitted = useRef("");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const hydrated = useCartHydrated();
  const cartIds = useCart((s) => s.items.map((i) => i.id).join("|"));

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then(({ default: L }) => {
      if (cancelled || !el.current) return;
      // One finger scrolls the page on phones; pinch zooms and pans the map.
      const map = L.map(el.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
      L.tileLayer(tiles, { attribution, subdomains: "abcd", maxZoom: 19 }).addTo(map);
      handle.current = { L, map, layer: L.layerGroup().addTo(map) };
      setReady(true);
    });
    return () => {
      cancelled = true;
      handle.current?.map.remove();
      handle.current = null;
      fitted.current = "";
    };
  }, []);

  useEffect(() => {
    const h = handle.current;
    if (!ready || !h) return;
    const { L, map, layer } = h;
    const picked = new Set(hydrated ? cartIds.split("|") : []);
    const shown = stops.filter((s) => active === null || s.group === active);
    layer.clearLayers();

    if (connect) {
      const ids = [...new Set(shown.map((s) => s.group))];
      for (const id of ids) {
        const line = shown.filter((s) => s.group === id);
        if (line.length < 2) continue;
        const color = groups.find((g) => g.id === id)?.color ?? line[0].color;
        L.polyline(
          line.map((s) => [s.lat, s.lng]),
          { color, weight: 3, opacity: 0.75, dashArray: "6 8" },
        ).addTo(layer);
      }
    }

    for (const s of shown) {
      const label = document.createElement("span");
      label.className = "rc-pin";
      label.style.background = s.color;
      // With every day showing, a pin says which day it belongs to; one day at a time, its stop number.
      label.textContent = active === null && groups.length > 1 && s.group !== undefined ? `D${s.group}` : s.label;
      if (s.cat) label.dataset.cat = s.cat;
      const icon = L.divIcon({
        className: `rc-pin-wrap${s.cartId && picked.has(s.cartId) ? " rc-pin-picked" : ""}`,
        html: label,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
      });
      const marker = L.marker([s.lat, s.lng], { icon, title: s.title, riseOnHover: true }).addTo(layer);
      marker.bindPopup(() => popup(s));
    }

    // Refit only when the set of pins changes, not when a cart ring is added.
    const fitKey = `${active}:${shown.map((s) => s.key).join("|")}`;
    if (shown.length && fitted.current !== fitKey) {
      fitted.current = fitKey;
      map.fitBounds(L.latLngBounds(shown.map((s) => [s.lat, s.lng])), { padding: [32, 32], maxZoom: 14 });
    }
  }, [ready, stops, groups, connect, active, cartIds, hydrated]);

  const activeGroup = groups.find((g) => g.id === active);

  return (
    <div>
      {groups.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {[{ id: null, label: "All days", color: "" }, ...groups].map((g) => (
            <button
              key={g.id ?? "all"}
              type="button"
              onClick={() => setActive(g.id)}
              aria-pressed={active === g.id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition ${
                active === g.id
                  ? "bg-foreground font-medium text-background"
                  : "border border-line bg-card text-muted hover:text-foreground"
              }`}
            >
              {g.color && <span className="size-2.5 rounded-full" style={{ background: g.color }} />}
              {g.label}
            </button>
          ))}
        </div>
      )}
      <div ref={el} className={`isolate overflow-hidden rounded-2xl border border-line bg-line ${className}`} />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted">
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1">
              <span className="size-2.5 rounded-full" style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
          {stops.some((s) => s.cartId) && (
            <li className="flex items-center gap-1">
              <span className="size-2.5 rounded-full ring-2 ring-foreground ring-offset-1 ring-offset-background" />
              In your cart
            </li>
          )}
        </ul>
        {activeGroup?.routeUrl && (
          <a
            href={activeGroup.routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          >
            {activeGroup.label} route in Google Maps <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted">Pins are approximate. Tap one for the exact spot in Google Maps.</p>
    </div>
  );
}

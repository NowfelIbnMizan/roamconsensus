import type { ItemCategory } from "@/generated/prisma/enums";

/** Same hues as the allocation bar, so a category reads the same on the map. Dark enough for white pin numbers. */
export const categoryHex: Record<ItemCategory, string> = {
  STAY: "#0f766e",
  EXPERIENCE: "#b45309",
  FOOD: "#e11d48",
  ESIM: "#0369a1",
  GEAR: "#7c3aed",
  TRANSIT: "#57534e",
};

const dayPalette = [
  "#0f766e",
  "#c2410c",
  "#7c3aed",
  "#2563eb",
  "#be185d",
  "#4d7c0f",
  "#a16207",
  "#0e7490",
  "#dc2626",
  "#4f46e5",
  "#9333ea",
  "#57534e",
];
/** Colour for the nth day of a schedule (0-based), so neighbouring days never share one. */
export const dayColor = (index: number) => dayPalette[index % dayPalette.length];

type Point = { lat: number; lng: number };

/** "West Nusa Penida (Kelingking Beach, …)" searches better without the parenthetical. */
const searchName = (name: string) => name.split(" (")[0].split(" / ")[0];

/** Google Maps search for the place by name, so travellers land on its listing (reviews, hours, photos). */
export function googleMapsPlaceUrl(name: string, near: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${searchName(name)}, ${near}`)}`;
}

/** Google Maps at the pin itself, when there's no destination name to search near. */
export const googleMapsPinUrl = (p: Point) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;

/** Google Maps directions through the stops in order. Google takes 11 stops at most, so longer lists are cut. */
export function googleMapsRouteUrl(all: Point[]) {
  const stops = all.slice(0, 11);
  if (stops.length === 0) return null;
  const at = (p: Point) => `${p.lat},${p.lng}`;
  const first = stops[0];
  const last = stops.at(-1)!;
  const middle = stops.slice(1, -1);
  const params = new URLSearchParams({ api: "1", destination: at(last), travelmode: "driving" });
  if (stops.length > 1) params.set("origin", at(first));
  if (middle.length) params.set("waypoints", middle.map(at).join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}

export const hasPin = <T extends { lat?: number | null; lng?: number | null }>(
  p: T,
): p is T & { lat: number; lng: number } => p.lat != null && p.lng != null;

const rad = Math.PI / 180;

/** Straight-line distance in km. */
export function distanceKm(a: Point, b: Point) {
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Rough drive time between two pins: roads run about 1.4x the straight line, and island traffic averages about
 * 25 km/h. Good enough to spot a packed day; Google Maps has the real figure.
 */
export function driveMinutes(a: Point, b: Point) {
  const km = distanceKm(a, b) * 1.4;
  return { km: Math.round(km), minutes: km < 0.5 ? 0 : Math.max(5, Math.round(((km / 25) * 60) / 5) * 5) };
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Hours on the road that make a day "packed". */
export const PACKED_MINUTES = 180;

/** Drive time from the previous pinned stop, for each pinned stop in order, and the day's total. */
export function dayLegs<T extends { id: string; lat?: number | null; lng?: number | null }>(stops: T[]) {
  const legs = new Map<string, { km: number; minutes: number }>();
  let prev: Point | null = null;
  let total = 0;
  for (const s of stops) {
    if (s.lat == null || s.lng == null) continue;
    const here = { lat: s.lat, lng: s.lng };
    if (prev) {
      const leg = driveMinutes(prev, here);
      legs.set(s.id, leg);
      total += leg.minutes;
    }
    prev = here;
  }
  return { legs, total };
}

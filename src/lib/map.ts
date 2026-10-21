import type { ItemCategory } from "@/generated/prisma/enums";

/** Same hues as the allocation bar, so a category reads the same on the map. */
export const categoryHex: Record<ItemCategory, string> = {
  STAY: "#0d9488",
  EXPERIENCE: "#f59e0b",
  FOOD: "#f43f5e",
  ESIM: "#0ea5e9",
  GEAR: "#8b5cf6",
  TRANSIT: "#78716c",
};

const dayPalette = [
  "#0f766e",
  "#ea580c",
  "#7c3aed",
  "#2563eb",
  "#db2777",
  "#65a30d",
  "#ca8a04",
  "#0891b2",
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

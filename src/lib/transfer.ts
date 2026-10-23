import { distanceKm } from "@/lib/map";

type City = { name: string };
type Point = { lat: number; lng: number };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Booking searches for getting from one city to the next. Plain links: no affiliate IDs yet. */
export function transferLinks(from: City, to: City) {
  return [
    {
      label: "Bus, train & ferry",
      site: "12Go",
      url: `https://12go.asia/en/travel/${slug(from.name)}/${slug(to.name)}`,
    },
    {
      label: "Flights",
      site: "Google Flights",
      url: `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights from ${from.name} to ${to.name}`)}`,
    },
    {
      label: "Compare all options",
      site: "Rome2Rio",
      url: `https://www.rome2rio.com/map/${encodeURIComponent(from.name)}/${encodeURIComponent(to.name)}`,
    },
  ];
}

/** Rough advice from straight-line distance between the last stop in one city and the first in the next. */
export function transferHint(a?: Point | null, b?: Point | null) {
  if (!a || !b) return null;
  const km = Math.round(distanceKm(a, b));
  if (km > 700) return { km, text: `About ${km.toLocaleString("en-US")} km apart, so most people fly.` };
  if (km > 250) return { km, text: `About ${km} km apart: an overnight train or bus, or a short flight.` };
  return { km, text: `About ${km} km apart: a few hours by bus, train or taxi.` };
}

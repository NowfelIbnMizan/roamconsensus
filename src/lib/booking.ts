import type { ItemCategory } from "@/generated/prisma/client";

/**
 * Where a stop with no booking link of its own can be booked: a search on a booking site for that stop.
 * Partner IDs are optional env vars, so once an affiliate program approves the site, adding the ID turns every
 * one of these links into an affiliate link with no code change.
 */
export function bookingSearch(
  item: { name: string; category: ItemCategory; priceCents: number | null },
  destination: string,
): { url: string; vendor: string } | null {
  const q = `${item.name} ${destination}`;
  if (item.category === "STAY") {
    const url = new URL("https://www.booking.com/searchresults.html");
    url.searchParams.set("ss", `${item.name}, ${destination}`);
    if (process.env.BOOKING_AID) url.searchParams.set("aid", process.env.BOOKING_AID);
    return { url: url.toString(), vendor: "Booking.com" };
  }
  // Free sights (beaches, temples, markets) need no ticket.
  if (item.category === "EXPERIENCE" && item.priceCents !== null && item.priceCents > 0) {
    const url = new URL("https://www.getyourguide.com/s/");
    url.searchParams.set("q", q);
    if (process.env.GYG_PARTNER_ID) url.searchParams.set("partner_id", process.env.GYG_PARTNER_ID);
    return { url: url.toString(), vendor: "GetYourGuide" };
  }
  return null;
}

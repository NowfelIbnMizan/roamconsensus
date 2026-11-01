/** A booking-site search (no exact product yet) says so, instead of promising a booking page. */
export const isSearchUrl = (url: string) => /booking\.com\/searchresults|getyourguide\.[a-z.]+\/s\//.test(url);

export function bookLabel(url: string, vendor?: string | null) {
  if (!vendor) return "Book";
  return isSearchUrl(url) ? `Find on ${vendor}` : `Book on ${vendor}`;
}

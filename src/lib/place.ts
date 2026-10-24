/**
 * "West Nusa Penida (Kelingking Beach, …)" searches better without the parenthetical. The place and city are joined by
 * PLACE_SEP so the photo finder can check a stock photo is of the place itself, not just the city (see lib/photos.ts).
 */
export const PLACE_SEP = " · ";
export function placeQuery(place: string, destination: string) {
  return `${place.split(" (")[0].split(" / ")[0]}${PLACE_SEP}${destination}`;
}

/** Places with a website get their own cache key so a stock photo cached earlier doesn't shadow the venue's. */
export function placePhotoKey(
  destination: string,
  place: { slug: string; website: string | null },
) {
  return `place:${destination}:${place.slug}${place.website ? ":site" : ""}`;
}

export const placeHref = (destination: string, place: string) =>
  `/destinations/${destination}/places/${place}`;

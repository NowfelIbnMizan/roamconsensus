/** "West Nusa Penida (Kelingking Beach, …)" searches better without the parenthetical. */
export function placeQuery(place: string, destination: string) {
  return `${place.split(" (")[0].split(" / ")[0]} ${destination}`;
}

/** Places with a website get their own cache key so a stock photo cached earlier doesn't shadow the venue's. */
export function placePhotoKey(destination: string, place: { slug: string; website: string | null }) {
  return `place:${destination}:${place.slug}${place.website ? ":site" : ""}`;
}

export const placeHref = (destination: string, place: string) => `/destinations/${destination}/places/${place}`;

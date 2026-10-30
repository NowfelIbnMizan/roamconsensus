import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { ItemCategory, Prisma } from "@/generated/prisma/client";
import { pickOffer, type CouponCandidate } from "@/lib/coupons";
import { bookingSearch } from "@/lib/booking";
import { creatorLinkSelect } from "@/lib/creator-links";
import { vibesOf, type VibeKey } from "@/lib/vibes";
import { cachedPhotoUrls } from "@/lib/photos";
import { placePhotoKey } from "@/lib/place";
import { convertCents, FALLBACK_RATES } from "@/lib/currency";

/** On every cached read of site content; admin saves invalidate it so edits show at once. */
export const CONTENT_TAG = "content";

const couponSelect = {
  vendorId: true,
  code: true,
  type: true,
  description: true,
  creatorId: true,
  validFrom: true,
  validTo: true,
  active: true,
} as const;

async function couponsByVendor(vendorIds: string[]) {
  const coupons = await db.coupon.findMany({
    where: { vendorId: { in: vendorIds }, active: true },
    select: couponSelect,
  });
  const map = new Map<string, CouponCandidate[]>();
  for (const { vendorId, ...c } of coupons)
    map.set(vendorId, [...(map.get(vendorId) ?? []), c]);
  return map;
}

type LinkRow = { url: string; creatorId: string | null };

function offerFor(
  item: { vendorId: string | null; links: LinkRow[] },
  creator: { id: string; name: string },
  coupons: Map<string, CouponCandidate[]>,
) {
  return pickOffer({
    platformUrl: item.links.find((l) => l.creatorId === null)?.url ?? null,
    creatorUrl: item.links.find((l) => l.creatorId === creator.id)?.url ?? null,
    creator,
    coupons: item.vendorId ? (coupons.get(item.vendorId) ?? []) : [],
  });
}

/** Resolve the best link + code for one item. Not cached: coupon validity depends on the current time. */
export async function resolveItemOffer(itemId: string) {
  const item = await db.item.findUnique({
    where: { id: itemId },
    select: {
      vendorId: true,
      links: { select: { url: true, creatorId: true } },
      itinerary: { select: { creator: { select: { id: true, name: true } } } },
    },
  });
  if (!item) return null;
  const coupons = await couponsByVendor(item.vendorId ? [item.vendorId] : []);
  return offerFor(item, item.itinerary.creator, coupons);
}

export async function getDestinations() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  cacheTag("destinations");
  return db.destination.findMany({
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      country: true,
      summary: true,
      heroPhotoUrl: true,
      isSample: true,
      _count: { select: { itineraries: true } },
    },
  });
}

export async function getDestinationSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return db.destination.findMany({ select: { slug: true } });
}

type Costed = {
  priceCents: number | null;
  /** The price's own currency; totals are in USD (Money converts for display). */
  currency?: string;
  quantity: number;
  place?: { closed: boolean } | null;
};
/** Closed places stay on the creator's route (it's their route) but count toward neither its cost nor its gaps. */
const counted = (item: Costed) => !item.place?.closed;
const isUnpriced = (item: Costed) => item.priceCents === null && counted(item);
function itemTotal(item: Costed) {
  if (!counted(item) || !item.priceCents) return 0;
  // Fixed rates are close enough for a "~" route total, and keep this function synchronous and cacheable.
  const usd = convertCents(item.priceCents, item.currency ?? "USD", "USD", FALLBACK_RATES).cents;
  return usd * item.quantity;
}

const placeItemSelect = {
  id: true,
  name: true,
  note: true,
  day: true,
  category: true,
  priceCents: true,
  priceNote: true,
  priceSourceUrl: true,
  currency: true,
  unit: true,
  quantity: true,
  sentiment: true,
  vendor: { select: { name: true } },
  links: { select: { url: true, creatorId: true } },
  itinerary: {
    select: {
      slug: true,
      title: true,
      creator: { select: creatorLinkSelect },
      destination: { select: { slug: true, name: true } },
    },
  },
} as const;

type PlaceWithItems = Prisma.PlaceGetPayload<{
  include: { items: { select: typeof placeItemSelect } };
}>;

/**
 * A place as the consensus list shows it. Consensus: how many distinct creators recommend it; AVOID items count
 * against it instead of for it.
 */
function placeSummary(place: PlaceWithItems) {
  const byCreator = (avoid: boolean) =>
    new Map(
      place.items
        .filter((i) => (i.sentiment === "AVOID") === avoid)
        .map((i) => [i.itinerary.creator.handle, i.itinerary.creator]),
    );
  const toList = <T>(m: Map<string, T>) => [...m.values()];
  // The cheapest priced recommendation stands in for the place: its price anchors the card
  // and it is what the + button puts in the cart.
  const recommended = place.items.filter((i) => i.sentiment !== "AVOID");
  const priced = recommended
    .filter((i) => i.priceCents !== null)
    .sort((a, b) => a.priceCents! - b.priceCents!);
  // A place only creators said to skip can still go in the cart; the traveller decides.
  const pick = priced[0] ?? recommended[0] ?? place.items[0];
  return {
    slug: place.slug,
    name: place.name,
    category: place.category,
    area: place.area,
    blurb: place.blurb,
    tip: place.tip,
    website: place.website,
    photos: place.hidePhoto ? [] : place.photos,
    lat: place.lat,
    lng: place.lng,
    fromPrice: priced[0]
      ? {
          cents: priced[0].priceCents!,
          unit: priced[0].unit,
          currency: priced[0].currency,
        }
      : null,
    cartItem: pick
      ? {
          id: pick.id,
          name: pick.name,
          category: pick.category,
          priceCents: pick.priceCents,
          priceNote: pick.priceNote,
          currency: pick.currency,
          unit: pick.unit,
          quantity: pick.quantity,
          vendor: pick.vendor?.name ?? null,
          bookUrl:
            pick.links.find((l) => l.creatorId === null)?.url ??
            pick.links[0]?.url ??
            null,
          website: place.website,
          lat: place.lat,
          lng: place.lng,
          itinerary: { slug: pick.itinerary.slug, title: pick.itinerary.title },
          destination: pick.itinerary.destination,
        }
      : null,
    creators: toList(byCreator(false)),
    skippedBy: toList(byCreator(true)),
  };
}

/** Middle of a destination's map pins (median, so one far-off day trip doesn't drag it), for the weather. */
function center(places: { lat: number | null; lng: number | null }[]) {
  const pins = places.filter((p) => p.lat !== null && p.lng !== null);
  if (!pins.length) return null;
  const median = (xs: number[]) =>
    xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  return {
    lat: median(pins.map((p) => p.lat!)),
    lng: median(pins.map((p) => p.lng!)),
  };
}

/** Each destination's middle, for the home page map. Destinations without pins are left out. */
export async function getDestinationCenters() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const places = await db.place.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    select: { lat: true, lng: true, destination: { select: { slug: true } } },
  });
  const by = new Map<string, typeof places>();
  for (const p of places)
    by.set(p.destination.slug, [...(by.get(p.destination.slug) ?? []), p]);
  return Object.fromEntries(
    [...by].map(([slug, pins]) => [slug, center(pins)!]),
  );
}

export async function getDestination(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  cacheTag(`destination:${slug}`);

  const destination = await db.destination.findUnique({
    where: { slug },
    include: {
      itineraries: {
        orderBy: { tier: "asc" },
        include: {
          creator: { select: { ...creatorLinkSelect, platform: true } },
          items: {
            select: {
              category: true,
              priceCents: true,
              currency: true,
              quantity: true,
              sentiment: true,
              place: { select: { slug: true, website: true, closed: true } },
            },
            orderBy: [{ day: "asc" }, { position: "asc" }],
          },
        },
      },
      months: {
        orderBy: { month: "asc" },
        omit: { id: true, destinationId: true },
      },
      tips: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          topic: true,
          title: true,
          body: true,
          sourceUrl: true,
        },
      },
      places: { include: { items: { select: placeItemSelect } } },
    },
  });
  if (!destination) return null;

  const creatorCount = new Set(destination.itineraries.map((i) => i.creatorId))
    .size;

  const consensus = destination.places
    .map(placeSummary)
    .filter((p) => p.creators.length > 0 || p.skippedBy.length > 0)
    .sort(
      (a, b) =>
        b.creators.length -
          b.skippedBy.length -
          (a.creators.length - a.skippedBy.length) ||
        a.name.localeCompare(b.name),
    );

  // Each route card shows a few of its stops' photos; only photos the site already has, so no stock lookups here.
  const routePlaces = destination.itineraries.map((it) => [
    ...new Map(
      it.items.flatMap((i) =>
        i.place && i.sentiment !== "AVOID" ? [[i.place.slug, i.place]] : [],
      ),
    ).values(),
  ]);
  const photos = await cachedPhotoUrls(
    routePlaces.flat().map((p) => placePhotoKey(slug, p)),
  );

  const routes = destination.itineraries.map((it, n) => {
    const byCategory = new Map<ItemCategory, number>();
    for (const item of it.items)
      byCategory.set(
        item.category,
        (byCategory.get(item.category) ?? 0) + itemTotal(item),
      );
    const totalCents = [...byCategory.values()].reduce((a, b) => a + b, 0);
    return {
      unpricedCount: it.items.filter(isUnpriced).length,
      stops: it.items.filter(counted).length,
      /** No hotel and no food listed: the total is sights only, so it can't be compared with full routes. */
      sightsOnly: !it.items.some(
        (i) => counted(i) && (i.category === "STAY" || i.category === "FOOD"),
      ),
      /** More than a day but no hotel listed: the total leaves out the biggest cost. */
      noStay: it.days > 1 && !it.items.some((i) => counted(i) && i.category === "STAY"),
      /** Places it recommends (not ones it says to skip), for comparing routes. */
      places: routePlaces[n].map((p) => p.slug),
      /** Up to three of its stops' photos, in trip order. */
      photos: routePlaces[n]
        .flatMap((p) => photos.get(placePhotoKey(slug, p)) ?? [])
        .slice(0, 3),
      slug: it.slug,
      title: it.title,
      summary: it.summary,
      editorTake: it.editorTake,
      tier: it.tier,
      days: it.days,
      creator: it.creator,
      totalCents,
      allocation: [...byCategory]
        .map(([category, cents]) => ({
          category,
          cents,
          pct: totalCents ? (cents / totalCents) * 100 : 0,
        }))
        .sort((a, b) => b.cents - a.cents),
    };
  });

  return {
    slug: destination.slug,
    name: destination.name,
    country: destination.country,
    summary: destination.summary,
    isSample: destination.isSample,
    climateSourceUrl: destination.climateSourceUrl,
    costGuide: destination.costGuide,
    months: destination.months,
    tips: destination.tips,
    creatorCount,
    consensus,
    routes,
    center: center(destination.places),
    /** Latest edit to the destination or any of its itineraries, as an ISO date. */
    updatedAt: new Date(
      Math.max(
        destination.updatedAt.getTime(),
        ...destination.itineraries.map((i) => i.updatedAt.getTime()),
      ),
    ).toISOString(),
  };
}

export async function getPlaceParams() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const places = await db.place.findMany({
    where: { items: { some: {} } },
    select: { slug: true, destination: { select: { slug: true } } },
  });
  return places.map((p) => ({ slug: p.destination.slug, place: p.slug }));
}

/** One place with everything creators said about it, plus the other pinned places of its destination. */
export async function getPlace(destinationSlug: string, placeSlug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  cacheTag(`place:${destinationSlug}:${placeSlug}`);

  const place = await db.place.findFirst({
    where: { slug: placeSlug, destination: { slug: destinationSlug } },
    include: {
      items: {
        select: placeItemSelect,
        orderBy: [{ day: "asc" }, { position: "asc" }],
      },
      destination: {
        select: {
          slug: true,
          name: true,
          country: true,
          itineraries: { select: { creatorId: true } },
        },
      },
    },
  });
  if (!place || place.items.length === 0) return null;
  const others = (await getPinnedPlaces(destinationSlug)).filter(
    (p) => p.slug !== placeSlug,
  );

  return {
    ...placeSummary(place),
    destination: {
      slug: place.destination.slug,
      name: place.destination.name,
      country: place.destination.country,
    },
    creatorCount: new Set(place.destination.itineraries.map((i) => i.creatorId))
      .size,
    mentions: place.items.map((i) => ({
      id: i.id,
      name: i.name,
      note: i.note,
      day: i.day,
      sentiment: i.sentiment,
      priceCents: i.priceCents,
      priceNote: i.priceNote,
      currency: i.currency,
      quantity: i.quantity,
      unit: i.unit,
      itinerary: { slug: i.itinerary.slug, title: i.itinerary.title },
      creator: i.itinerary.creator,
    })),
    others,
  };
}

/**
 * Every pinned, recommended place of a destination, for the map and "nearby" list on each place page. Cached per
 * city, so a build reads each city's places once instead of once per place page.
 */
async function getPinnedPlaces(destinationSlug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);

  const places = await db.place.findMany({
    where: {
      destination: { slug: destinationSlug },
      lat: { not: null },
      items: { some: {} },
    },
    // Full rows, so each nearby spot comes with the item its + button adds.
    include: { items: { select: placeItemSelect } },
  });
  const photos = await cachedPhotoUrls(
    places.map((p) => placePhotoKey(destinationSlug, p)),
  );
  return places.map((p) => ({
    ...placeSummary(p),
    lat: p.lat!,
    lng: p.lng!,
    photoUrl: photos.get(placePhotoKey(destinationSlug, p)) ?? null,
  }));
}

/** Every route and recommended spot, tagged with trip vibes, for the trip quiz. */
export async function getQuizData() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);

  const itineraries = await db.itinerary.findMany({
    include: {
      destination: { select: { slug: true, name: true } },
      creator: { select: creatorLinkSelect },
      items: {
        select: {
          name: true,
          note: true,
          category: true,
          priceCents: true,
          currency: true,
          quantity: true,
          sentiment: true,
          place: {
            select: {
              slug: true,
              name: true,
              area: true,
              blurb: true,
              category: true,
              website: true,
              closed: true,
            },
          },
        },
      },
    },
  });

  // One photo per route card: its first must-see with a photo, else any stop's, else the city cover.
  const photos = await cachedPhotoUrls([
    ...itineraries.map((it) => `destination:${it.destination.slug}`),
    ...itineraries.flatMap((it) =>
      it.items.flatMap((i) =>
        i.place ? [placePhotoKey(it.destination.slug, i.place)] : [],
      ),
    ),
  ]);
  const places = new Map<
    string,
    {
      slug: string;
      destination: string;
      name: string;
      area: string | null;
      category: ItemCategory;
      vibes: VibeKey[];
      creators: Set<string>;
    }
  >();
  const routes = itineraries.map((it) => {
    const counts: Record<string, number> = {};
    const kept = it.items.filter((i) => i.sentiment !== "AVOID");
    for (const i of kept) {
      const vibes = vibesOf(
        [i.name, i.place?.name].filter(Boolean).join(" "),
        [i.note, i.place?.blurb].filter(Boolean).join(" "),
        i.category,
      );
      for (const v of vibes) counts[v] = (counts[v] ?? 0) + 1;
      if (i.place) {
        const key = `${it.destination.slug}/${i.place.slug}`;
        const p = places.get(key) ?? {
          slug: i.place.slug,
          destination: it.destination.slug,
          name: i.place.name,
          area: i.place.area,
          category: i.place.category,
          vibes: [],
          creators: new Set<string>(),
        };
        p.vibes = [...new Set([...p.vibes, ...vibes])];
        p.creators.add(it.creatorId);
        places.set(key, p);
      }
    }
    const photoOf = (i: (typeof kept)[number]) =>
      i.place
        ? photos.get(placePhotoKey(it.destination.slug, i.place))
        : undefined;
    const photoUrl =
      kept
        .filter((i) => i.sentiment === "MUST_VISIT")
        .map(photoOf)
        .find(Boolean) ??
      kept.map(photoOf).find(Boolean) ??
      photos.get(`destination:${it.destination.slug}`) ??
      null;
    return {
      slug: it.slug,
      title: it.title,
      photoUrl,
      tier: it.tier,
      days: it.days,
      destination: it.destination,
      creator: it.creator,
      totalCents: it.items.reduce((sum, i) => sum + itemTotal(i), 0),
      unpricedCount: kept.filter(isUnpriced).length,
      stops: kept.filter(counted).length,
      /** Hotels without a price leave the total far too low to compare against a budget. */
      unpricedStays: kept.filter((i) => i.category === "STAY" && isUnpriced(i))
        .length,
      /** No hotel and no food listed: the total is sights only, so it can't be compared with full routes. */
      sightsOnly: !kept.some(
        (i) => counted(i) && (i.category === "STAY" || i.category === "FOOD"),
      ),
      /** More than a day but no hotel listed: the total leaves out the biggest cost. */
      noStay: it.days > 1 && !kept.some((i) => counted(i) && i.category === "STAY"),
      /** Share of the route's stops matching each vibe, 0–1. */
      vibes: Object.fromEntries(
        Object.entries(counts).map(([k, n]) => [
          k,
          n / Math.max(1, kept.length),
        ]),
      ),
    };
  });

  return {
    routes,
    places: [...places.values()].map(({ creators, ...p }) => ({
      ...p,
      creatorCount: creators.size,
    })),
  };
}

export type QuizData = Awaited<ReturnType<typeof getQuizData>>;

/** Everything the search box can find. Small enough to send whole and filter in the browser. */
export async function getSearchIndex() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const [destinations, places, creators, itineraries] = await Promise.all([
    db.destination.findMany({
      select: { slug: true, name: true, country: true, summary: true },
    }),
    db.place.findMany({
      where: { items: { some: {} } },
      select: {
        slug: true,
        name: true,
        area: true,
        category: true,
        blurb: true,
        destination: { select: { slug: true, name: true } },
      },
    }),
    db.creator.findMany({
      where: { itineraries: { some: {} } },
      select: { handle: true, name: true, bio: true },
    }),
    db.itinerary.findMany({
      select: {
        slug: true,
        title: true,
        summary: true,
        days: true,
        creator: { select: { name: true } },
        destination: { select: { name: true } },
      },
    }),
  ]);
  return [
    ...destinations.map((d) => ({
      kind: "Destination" as const,
      href: `/destinations/${d.slug}`,
      title: d.name,
      sub: d.country,
      text: `${d.name} ${d.country} ${d.summary}`,
    })),
    ...itineraries.map((i) => ({
      kind: "Itinerary" as const,
      href: `/itineraries/${i.slug}`,
      title: i.title,
      sub: `${i.days} days by ${i.creator.name} · ${i.destination.name}`,
      text: `${i.title} ${i.summary} ${i.creator.name} ${i.destination.name}`,
    })),
    ...places.map((p) => ({
      kind: "Spot" as const,
      href: `/destinations/${p.destination.slug}/places/${p.slug}`,
      title: p.name,
      sub: [p.area, p.destination.name].filter(Boolean).join(", "),
      text: `${p.name} ${p.area ?? ""} ${p.destination.name} ${p.category} ${p.blurb ?? ""}`,
    })),
    ...creators.map((c) => ({
      kind: "Creator" as const,
      href: `/creators/${c.handle}`,
      title: c.name,
      sub: `@${c.handle}`,
      text: `${c.name} ${c.handle} ${c.bio ?? ""}`,
    })),
  ];
}

export type SearchEntry = Awaited<ReturnType<typeof getSearchIndex>>[number];

export async function getItinerarySlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return db.itinerary.findMany({ select: { slug: true } });
}

export async function getItinerary(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  cacheTag(`itinerary:${slug}`);

  const it = await db.itinerary.findUnique({
    where: { slug },
    include: {
      destination: { select: { slug: true, name: true, isSample: true } },
      creator: { select: { id: true, ...creatorLinkSelect, platform: true } },
      items: {
        orderBy: [{ day: "asc" }, { position: "asc" }],
        include: {
          vendor: { select: { name: true } },
          place: {
            select: {
              slug: true,
              website: true,
              lat: true,
              lng: true,
              tip: true,
              closed: true,
              area: true,
              blurb: true,
            },
          },
          links: { select: { url: true, creatorId: true } },
        },
      },
    },
  });
  if (!it) return null;

  // Resolved when the page is cached (hourly), so a code can outlive its validTo by up to the cache lifetime.
  const coupons = await couponsByVendor([
    ...new Set(it.items.flatMap((i) => (i.vendorId ? [i.vendorId] : []))),
  ]);

  const days = new Map<number, typeof it.items>();
  for (const item of it.items)
    days.set(item.day, [...(days.get(item.day) ?? []), item]);
  const photoKey = (place: { slug: string; website: string | null }) =>
    placePhotoKey(it.destination.slug, place);
  const coverKey = `destination:${it.destination.slug}`;
  const photos = await cachedPhotoUrls([
    coverKey,
    ...it.items.flatMap((i) => (i.place ? [photoKey(i.place)] : [])),
  ]);

  return {
    slug: it.slug,
    title: it.title,
    summary: it.summary,
    editorTake: it.editorTake,
    tier: it.tier,
    days: it.days,
    sourceUrl: it.sourceUrl,
    updatedAt: it.updatedAt.toISOString(),
    destination: it.destination,
    /** The city's cover photo, if the site already has one. */
    coverUrl: photos.get(coverKey) ?? null,
    creator: it.creator,
    totalCents: it.items.reduce((sum, i) => sum + itemTotal(i), 0),
    unpricedCount: it.items.filter(isUnpriced).length,
    schedule: [...days].map(([day, items]) => ({
      day,
      items: items.map((i) => {
        const offer = offerFor(i, it.creator, coupons);
        const search = offer ? null : bookingSearch(i, it.destination.name);
        return {
          id: i.id,
          day: i.day,
          name: i.name,
          note: i.note,
          category: i.category,
          priceCents: i.priceCents,
          priceNote: i.priceNote,
          priceSourceUrl: i.priceSourceUrl,
          priceCheckedAt: i.priceCheckedAt?.toISOString() ?? null,
          sentiment: i.sentiment,
          quantity: i.quantity,
          unit: i.unit,
          currency: i.currency,
          vendor: search ? search.vendor : (i.vendor?.name ?? null),
          bookUrl: offer?.url ?? search?.url ?? null,
          /** The link is a search on a booking site, not this exact listing. */
          bookIsSearch: Boolean(search),
          couponNote: offer?.description ?? null,
          website: i.place?.website ?? null,
          placeSlug: i.place?.slug ?? null,
          area: i.place?.area ?? null,
          blurb: i.place?.blurb ?? null,
          /** Set when the place is marked closed in Admin > destination > Places: its tip, or just "Closed". */
          closedNote: i.place?.closed ? (i.place.tip ?? "Closed") : null,
          /** The place's photo when the site already has one; lists show a category tile otherwise. */
          photoUrl: (i.place && photos.get(photoKey(i.place))) ?? null,
          lat: i.place?.lat ?? null,
          lng: i.place?.lng ?? null,
          couponCode: offer?.code ?? null,
          creditedTo: offer?.creditedTo ?? null,
        };
      }),
    })),
  };
}

/** Every creator with their links and itineraries, for the Creators page. */
export async function getCreators() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const creators = await db.creator.findMany({
    where: { itineraries: { some: {} } },
    orderBy: { name: "asc" },
    select: {
      ...creatorLinkSelect,
      platform: true,
      bio: true,
      itineraries: {
        orderBy: [{ destination: { name: "asc" } }, { days: "asc" }],
        select: {
          slug: true,
          title: true,
          tier: true,
          days: true,
          destination: { select: { slug: true, name: true } },
        },
      },
    },
  });
  const covers = await cachedPhotoUrls([
    ...new Set(
      creators.flatMap((c) =>
        c.itineraries.map((it) => `destination:${it.destination.slug}`),
      ),
    ),
  ]);
  return creators.map((c) => ({
    ...c,
    itineraries: c.itineraries.map((it) => ({
      ...it,
      /** The city's cover photo, if the site already has one. */
      coverUrl: covers.get(`destination:${it.destination.slug}`) ?? null,
    })),
  }));
}

/** Headline numbers for the home page. Places count only those a creator actually recommends. */
export async function getSiteStats() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const [cities, trips, creators, places, stops] = await Promise.all([
    db.destination.count(),
    db.itinerary.count(),
    // Only creators with a route on the site; one whose routes were all deleted shouldn't count.
    db.creator.findMany({
      where: { itineraries: { some: {} } },
      orderBy: { name: "asc" },
      select: { handle: true, name: true, avatarUrl: true, hideAvatar: true },
    }),
    db.place.count({
      where: { items: { some: { sentiment: { not: "AVOID" } } } },
    }),
    db.item.count(),
  ]);
  return { cities, trips, creators, places, stops };
}

export async function getCreatorHandles() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return db.creator.findMany({ select: { handle: true } });
}

export async function getCreator(handle: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  cacheTag(`creator:${handle}`);
  const creator = await db.creator.findUnique({
    where: { handle },
    select: {
      ...creatorLinkSelect,
      platform: true,
      bio: true,
      itineraries: {
        orderBy: [{ destination: { name: "asc" } }, { days: "asc" }],
        select: {
          slug: true,
          title: true,
          tier: true,
          days: true,
          destination: { select: { slug: true, name: true } },
          items: {
            select: {
              sentiment: true,
              place: { select: { slug: true, website: true } },
            },
            orderBy: [{ day: "asc" }, { position: "asc" }],
          },
        },
      },
    },
  });
  if (!creator) return null;

  // Photos the site already has (no stock lookups): each trip's stops, and each city's cover.
  const stopsOf = creator.itineraries.map((it) => [
    ...new Map(
      it.items.flatMap((i) =>
        i.place && i.sentiment !== "AVOID" ? [[i.place.slug, i.place]] : [],
      ),
    ).values(),
  ]);
  const photos = await cachedPhotoUrls([
    ...new Set(
      creator.itineraries.map((it) => `destination:${it.destination.slug}`),
    ),
    ...creator.itineraries.flatMap((it, n) =>
      stopsOf[n].map((p) => placePhotoKey(it.destination.slug, p)),
    ),
  ]);
  return {
    ...creator,
    itineraries: creator.itineraries.map(({ items, ...it }, n) => ({
      ...it,
      stops: items.length,
      places: stopsOf[n].length,
      coverUrl: photos.get(`destination:${it.destination.slug}`) ?? null,
      /** Up to three of its stops' photos, in trip order. */
      photos: stopsOf[n]
        .flatMap((p) => photos.get(placePhotoKey(it.destination.slug, p)) ?? [])
        .slice(0, 3),
    })),
  };
}

export async function getEsimPlans(country: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  cacheTag(`esim:${country}`);
  return db.esimPlan.findMany({
    where: { country },
    orderBy: { priceCents: "asc" },
    select: {
      id: true,
      provider: true,
      name: true,
      dataMb: true,
      days: true,
      priceCents: true,
      currency: true,
      network: true,
      speed: true,
      hotspot: true,
      notes: true,
      url: true,
      sourceUrl: true,
      checkedAt: true,
    },
  });
}

export type EsimPlanRow = Awaited<ReturnType<typeof getEsimPlans>>[number];

/** Nightly stays the creators recommend in a destination, for the budget calculator. */
export async function getStays(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  cacheTag(`destination:${slug}`);
  const items = await db.item.findMany({
    where: {
      category: "STAY",
      unit: "night",
      priceCents: { gt: 0 },
      itinerary: { destination: { slug } },
    },
    select: {
      name: true,
      priceCents: true,
      currency: true,
      itinerary: {
        select: { tier: true, slug: true, creator: { select: { name: true } } },
      },
    },
  });
  return items.map((i) => ({
    name: i.name,
    priceCents: i.priceCents!,
    currency: i.currency,
    tier: i.itinerary.tier,
    itinerary: i.itinerary.slug,
    creator: i.itinerary.creator.name,
  }));
}

const postSelect = {
  slug: true,
  title: true,
  excerpt: true,
  coverUrl: true,
  publishedAt: true,
  updatedAt: true,
  destination: { select: { slug: true, name: true } },
} as const;

const postDates = <T extends { publishedAt: Date | null; updatedAt: Date }>(
  p: T,
) => ({
  ...p,
  publishedAt: (p.publishedAt ?? p.updatedAt).toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

/** Published blog posts, newest first. Optionally only those about one city. */
export async function getPosts(destinationSlug?: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const posts = await db.post.findMany({
    where: {
      published: true,
      ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    select: postSelect,
  });
  return posts.map(postDates);
}

export async function getPost(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const post = await db.post.findUnique({
    where: { slug },
    select: { ...postSelect, body: true, published: true },
  });
  return post?.published ? postDates(post) : null;
}

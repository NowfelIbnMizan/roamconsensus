import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { ItemCategory, Prisma } from "@/generated/prisma/client";
import { pickOffer, type CouponCandidate } from "@/lib/coupons";
import { bookingSearch } from "@/lib/booking";
import { creatorLinkSelect } from "@/lib/creator-links";
import { vibesOf, type VibeKey } from "@/lib/vibes";

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
  for (const { vendorId, ...c } of coupons) map.set(vendorId, [...(map.get(vendorId) ?? []), c]);
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

function itemTotal(item: { priceCents: number | null; quantity: number }) {
  return (item.priceCents ?? 0) * item.quantity;
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
  itinerary: { select: { slug: true, title: true, creator: { select: creatorLinkSelect } } },
} as const;

type PlaceWithItems = Prisma.PlaceGetPayload<{ include: { items: { select: typeof placeItemSelect } } }>;

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
  const priced = recommended.filter((i) => i.priceCents !== null).sort((a, b) => a.priceCents! - b.priceCents!);
  const pick = priced[0] ?? recommended[0];
  return {
    slug: place.slug,
    name: place.name,
    category: place.category,
    area: place.area,
    blurb: place.blurb,
    tip: place.tip,
    website: place.website,
    lat: place.lat,
    lng: place.lng,
    fromPrice: priced[0] ? { cents: priced[0].priceCents!, unit: priced[0].unit, currency: priced[0].currency } : null,
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
          bookUrl: pick.links.find((l) => l.creatorId === null)?.url ?? pick.links[0]?.url ?? null,
          website: place.website,
          lat: place.lat,
          lng: place.lng,
          itinerary: { slug: pick.itinerary.slug, title: pick.itinerary.title },
        }
      : null,
    creators: toList(byCreator(false)),
    skippedBy: toList(byCreator(true)),
  };
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
              quantity: true,
              sentiment: true,
              place: { select: { slug: true } },
            },
          },
        },
      },
      months: { orderBy: { month: "asc" }, omit: { id: true, destinationId: true } },
      tips: {
        orderBy: { position: "asc" },
        select: { id: true, topic: true, title: true, body: true, sourceUrl: true },
      },
      places: { include: { items: { select: placeItemSelect } } },
    },
  });
  if (!destination) return null;

  const creatorCount = new Set(destination.itineraries.map((i) => i.creatorId)).size;

  const consensus = destination.places
    .map(placeSummary)
    .filter((p) => p.creators.length > 0 || p.skippedBy.length > 0)
    .sort(
      (a, b) =>
        b.creators.length - b.skippedBy.length - (a.creators.length - a.skippedBy.length) ||
        a.name.localeCompare(b.name),
    );

  const routes = destination.itineraries.map((it) => {
    const byCategory = new Map<ItemCategory, number>();
    for (const item of it.items) byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + itemTotal(item));
    const totalCents = [...byCategory.values()].reduce((a, b) => a + b, 0);
    return {
      unpricedCount: it.items.filter((i) => i.priceCents === null).length,
      stops: it.items.length,
      /** Places it recommends (not ones it says to skip), for comparing routes. */
      places: [...new Set(it.items.flatMap((i) => (i.place && i.sentiment !== "AVOID" ? [i.place.slug] : [])))],
      slug: it.slug,
      title: it.title,
      summary: it.summary,
      editorTake: it.editorTake,
      tier: it.tier,
      days: it.days,
      creator: it.creator,
      totalCents,
      allocation: [...byCategory]
        .map(([category, cents]) => ({ category, cents, pct: totalCents ? (cents / totalCents) * 100 : 0 }))
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
    months: destination.months,
    tips: destination.tips,
    creatorCount,
    consensus,
    routes,
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
      items: { select: placeItemSelect, orderBy: [{ day: "asc" }, { position: "asc" }] },
      destination: {
        select: {
          slug: true,
          name: true,
          country: true,
          itineraries: { select: { creatorId: true } },
          places: {
            where: { slug: { not: placeSlug }, lat: { not: null }, items: { some: {} } },
            select: { slug: true, name: true, category: true, area: true, lat: true, lng: true },
          },
        },
      },
    },
  });
  if (!place || place.items.length === 0) return null;

  return {
    ...placeSummary(place),
    destination: { slug: place.destination.slug, name: place.destination.name, country: place.destination.country },
    creatorCount: new Set(place.destination.itineraries.map((i) => i.creatorId)).size,
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
    others: place.destination.places.map((p) => ({ ...p, lat: p.lat!, lng: p.lng! })),
  };
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
          quantity: true,
          sentiment: true,
          place: { select: { slug: true, name: true, area: true, blurb: true, category: true } },
        },
      },
    },
  });

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
      const text = [i.name, i.note, i.place?.name, i.place?.blurb].filter(Boolean).join(" ");
      const vibes = vibesOf(text, i.category);
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
    return {
      slug: it.slug,
      title: it.title,
      tier: it.tier,
      days: it.days,
      destination: it.destination,
      creator: it.creator,
      totalCents: it.items.reduce((sum, i) => sum + itemTotal(i), 0),
      unpricedCount: kept.filter((i) => i.priceCents === null).length,
      /** Hotels without a price leave the total far too low to compare against a budget. */
      unpricedStays: kept.filter((i) => i.category === "STAY" && i.priceCents === null).length,
      /** Share of the route's stops matching each vibe, 0–1. */
      vibes: Object.fromEntries(Object.entries(counts).map(([k, n]) => [k, n / Math.max(1, kept.length)])),
    };
  });

  return {
    routes,
    places: [...places.values()].map(({ creators, ...p }) => ({ ...p, creatorCount: creators.size })),
  };
}

export type QuizData = Awaited<ReturnType<typeof getQuizData>>;

/** Everything the search box can find. Small enough to send whole and filter in the browser. */
export async function getSearchIndex() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const [destinations, places, creators, itineraries] = await Promise.all([
    db.destination.findMany({ select: { slug: true, name: true, country: true, summary: true } }),
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
    db.creator.findMany({ where: { itineraries: { some: {} } }, select: { handle: true, name: true, bio: true } }),
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
          place: { select: { slug: true, website: true, lat: true, lng: true } },
          links: { select: { url: true, creatorId: true } },
        },
      },
    },
  });
  if (!it) return null;

  // Resolved when the page is cached (hourly), so a code can outlive its validTo by up to the cache lifetime.
  const coupons = await couponsByVendor([...new Set(it.items.flatMap((i) => (i.vendorId ? [i.vendorId] : [])))]);

  const days = new Map<number, typeof it.items>();
  for (const item of it.items) days.set(item.day, [...(days.get(item.day) ?? []), item]);

  return {
    slug: it.slug,
    title: it.title,
    summary: it.summary,
    editorTake: it.editorTake,
    tier: it.tier,
    days: it.days,
    sourceUrl: it.sourceUrl,
    destination: it.destination,
    creator: it.creator,
    totalCents: it.items.reduce((sum, i) => sum + itemTotal(i), 0),
    unpricedCount: it.items.filter((i) => i.priceCents === null).length,
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
  return db.creator.findMany({
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
  return db.creator.findUnique({
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
          destination: { select: { name: true } },
        },
      },
    },
  });
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
    where: { category: "STAY", unit: "night", priceCents: { gt: 0 }, itinerary: { destination: { slug } } },
    select: {
      name: true,
      priceCents: true,
      currency: true,
      itinerary: { select: { tier: true, slug: true, creator: { select: { name: true } } } },
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

import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { ItemCategory } from "@/generated/prisma/client";
import { pickOffer, type CouponCandidate } from "@/lib/coupons";
import { creatorLinkSelect } from "@/lib/creator-links";

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
  const coupons = await db.coupon.findMany({ where: { vendorId: { in: vendorIds }, active: true }, select: couponSelect });
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
          items: { select: { category: true, priceCents: true, quantity: true } },
        },
      },
      places: {
        include: {
          items: {
            select: {
              sentiment: true,
              itinerary: { select: { creator: { select: creatorLinkSelect } } },
            },
          },
        },
      },
    },
  });
  if (!destination) return null;

  const creatorCount = new Set(destination.itineraries.map((i) => i.creatorId)).size;

  // Consensus: how many distinct creators recommend each place. AVOID items
  // count against a place instead of for it.
  const consensus = destination.places
    .map((place) => {
      const byCreator = (avoid: boolean) =>
        new Map(
          place.items
            .filter((i) => (i.sentiment === "AVOID") === avoid)
            .map((i) => [i.itinerary.creator.handle, i.itinerary.creator]),
        );
      const toList = <T,>(m: Map<string, T>) => [...m.values()];
      return {
        slug: place.slug,
        name: place.name,
        category: place.category,
        tip: place.tip,
        website: place.website,
        creators: toList(byCreator(false)),
        skippedBy: toList(byCreator(true)),
      };
    })
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
      slug: it.slug,
      title: it.title,
      summary: it.summary,
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
    creatorCount,
    consensus,
    routes,
  };
}

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
          place: { select: { slug: true, website: true } },
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
        return {
        id: i.id,
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
        vendor: i.vendor?.name ?? null,
        bookUrl: offer?.url ?? null,
        website: i.place?.website ?? null,
        couponCode: offer?.code ?? null,
        creditedTo: offer?.creditedTo ?? null,
      };
      }),
    })),
  };
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

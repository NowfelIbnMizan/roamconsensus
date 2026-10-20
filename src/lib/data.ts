import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { ItemCategory } from "@/generated/prisma/client";

export async function getDestinations() {
  "use cache";
  cacheLife("hours");
  cacheTag("destinations");
  return db.destination.findMany({
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      country: true,
      summary: true,
      heroPhotoUrl: true,
      _count: { select: { itineraries: true } },
    },
  });
}

export async function getDestinationSlugs() {
  "use cache";
  cacheLife("hours");
  return db.destination.findMany({ select: { slug: true } });
}

function itemTotal(item: { priceCents: number; quantity: number }) {
  return item.priceCents * item.quantity;
}

export async function getDestination(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`destination:${slug}`);

  const destination = await db.destination.findUnique({
    where: { slug },
    include: {
      itineraries: {
        orderBy: { tier: "asc" },
        include: {
          creator: { select: { handle: true, name: true, platform: true } },
          items: { select: { category: true, priceCents: true, quantity: true } },
        },
      },
      places: {
        include: {
          items: { select: { itinerary: { select: { creator: { select: { handle: true, name: true } } } } } },
        },
      },
    },
  });
  if (!destination) return null;

  const creatorCount = new Set(destination.itineraries.map((i) => i.creatorId)).size;

  // Consensus: how many distinct creators recommend each place.
  const consensus = destination.places
    .map((place) => {
      const creators = new Map(place.items.map((i) => [i.itinerary.creator.handle, i.itinerary.creator.name]));
      return {
        slug: place.slug,
        name: place.name,
        category: place.category,
        tip: place.tip,
        creators: [...creators].map(([handle, name]) => ({ handle, name })),
      };
    })
    .filter((p) => p.creators.length > 0)
    .sort((a, b) => b.creators.length - a.creators.length || a.name.localeCompare(b.name));

  const routes = destination.itineraries.map((it) => {
    const byCategory = new Map<ItemCategory, number>();
    for (const item of it.items) byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + itemTotal(item));
    const totalCents = [...byCategory.values()].reduce((a, b) => a + b, 0);
    return {
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
    creatorCount,
    consensus,
    routes,
  };
}

export async function getItinerarySlugs() {
  "use cache";
  cacheLife("hours");
  return db.itinerary.findMany({ select: { slug: true } });
}

export async function getItinerary(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`itinerary:${slug}`);

  const it = await db.itinerary.findUnique({
    where: { slug },
    include: {
      destination: { select: { slug: true, name: true } },
      creator: { select: { handle: true, name: true, platform: true } },
      items: {
        orderBy: [{ day: "asc" }, { position: "asc" }],
        include: {
          vendor: { select: { name: true } },
          place: { select: { slug: true } },
          // Platform deep link (creatorId null) for now; coupon fallback resolver lands in step 4.
          links: { where: { creatorId: null }, select: { url: true }, take: 1 },
        },
      },
    },
  });
  if (!it) return null;

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
    schedule: [...days].map(([day, items]) => ({
      day,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        note: i.note,
        category: i.category,
        priceCents: i.priceCents,
        quantity: i.quantity,
        unit: i.unit,
        currency: i.currency,
        vendor: i.vendor?.name ?? null,
        bookUrl: i.links[0]?.url ?? null,
      })),
    })),
  };
}

export async function getCreatorHandles() {
  "use cache";
  cacheLife("hours");
  return db.creator.findMany({ select: { handle: true } });
}

export async function getCreator(handle: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`creator:${handle}`);
  return db.creator.findUnique({
    where: { handle },
    select: {
      handle: true,
      name: true,
      platform: true,
      bio: true,
      profileUrl: true,
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

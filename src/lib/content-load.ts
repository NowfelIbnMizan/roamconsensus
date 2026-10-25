// Writes one itinerary from the data/ format into the database. Used by the seed and the admin panel's import.
import type { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ItineraryData } from "@/lib/content-schema";

export const toSlug = (s: string) =>
  s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Creates (or replaces) the itinerary and its items; the maps turn data/ slugs into database ids. */
export async function loadItinerary(
  db: PrismaClient,
  { items, creator, ...it }: z.infer<typeof ItineraryData>,
  destinationId: string,
  creatorIds: Map<string, string>,
  placeIds: Map<string, string>,
  vendorIds: Map<string, string>,
) {
  const data = { ...it, destinationId, creatorId: creatorIds.get(creator)! };
  const itinerary = await db.itinerary.upsert({ where: { slug: it.slug }, create: data, update: data });
  // Replace items wholesale, but with ids built from itinerary + name so saved carts still match after a reseed.
  await db.item.deleteMany({ where: { itineraryId: itinerary.id } });
  const usedIds = new Set<string>();
  for (const [position, item] of items.entries()) {
    const vendorId = item.vendor ? vendorIds.get(item.vendor) : undefined;
    const base = `${it.slug}--${toSlug(item.name)}`;
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);
    await db.item.create({
      data: {
        id,
        itineraryId: itinerary.id,
        day: item.day,
        position,
        name: item.name,
        note: item.note,
        category: item.category,
        priceCents: item.price === undefined ? null : Math.round(item.price * 100),
        priceNote: item.priceNote,
        priceSourceUrl: item.priceSource,
        priceCheckedAt: item.priceSource ? new Date() : undefined,
        sentiment: item.sentiment,
        currency: item.currency,
        unit: item.unit,
        quantity: item.quantity,
        placeId: item.place ? placeIds.get(item.place) : undefined,
        vendorId,
        links:
          vendorId && (item.ourUrl || item.creatorUrl)
            ? {
                create: [
                  ...(item.ourUrl ? [{ vendorId, url: item.ourUrl }] : []),
                  ...(item.creatorUrl ? [{ vendorId, url: item.creatorUrl, creatorId: data.creatorId }] : []),
                ],
              }
            : undefined,
      },
    });
  }
}

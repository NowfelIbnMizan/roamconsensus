"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/data";
import { logIn, logOut, requireAdmin } from "@/lib/admin/auth";
import type { CouponType, ItemCategory, Platform, Sentiment, Tier } from "@/generated/prisma/enums";

// Form helpers: blank inputs become null so clearing a field clears it in the database.
const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const optional = (fd: FormData, key: string) => text(fd, key) || null;
const int = (fd: FormData, key: string, fallback = 0) => {
  const n = Number.parseInt(text(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
};
/** Dollars typed in a form, stored as cents. Blank = no price. */
const cents = (fd: FormData, key: string) => {
  const v = text(fd, key);
  if (v === "") return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};
const checkbox = (fd: FormData, key: string) => fd.get(key) === "on";
const date = (fd: FormData, key: string) => (text(fd, key) ? new Date(text(fd, key)) : null);
const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Every save ends here: refresh the public site's cached pages. */
function published() {
  updateTag(CONTENT_TAG);
}

export async function logInAction(_: string | null, fd: FormData) {
  if (!(await logIn(text(fd, "password")))) return "Wrong password.";
  redirect("/admin");
}

export async function logOutAction() {
  await logOut();
  redirect("/admin/login");
}

// Destinations

export async function saveDestination(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const data = {
    slug: slugify(text(fd, "slug") || text(fd, "name")),
    name: text(fd, "name"),
    country: text(fd, "country"),
    summary: text(fd, "summary"),
    isSample: checkbox(fd, "isSample"),
  };
  const row = id ? await db.destination.update({ where: { id }, data }) : await db.destination.create({ data });
  published();
  if (!id) redirect(`/admin/destinations/${row.id}`);
}

export async function deleteDestination(fd: FormData) {
  await requireAdmin();
  await db.destination.delete({ where: { id: text(fd, "id") } });
  published();
  redirect("/admin");
}

// Places

export async function savePlace(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const data = {
    slug: slugify(text(fd, "slug") || text(fd, "name")),
    name: text(fd, "name"),
    category: text(fd, "category") as ItemCategory,
    tip: optional(fd, "tip"),
    website: optional(fd, "website"),
  };
  if (id) await db.place.update({ where: { id }, data });
  else await db.place.create({ data: { ...data, destinationId: text(fd, "destinationId") } });
  published();
}

export async function deletePlace(fd: FormData) {
  await requireAdmin();
  await db.place.delete({ where: { id: text(fd, "id") } });
  published();
}

// Creators

export async function saveCreator(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const data = {
    handle: text(fd, "handle")
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9.-]/g, ""),
    name: text(fd, "name"),
    platform: text(fd, "platform") as Platform,
    profileUrl: text(fd, "profileUrl"),
    bio: optional(fd, "bio"),
  };
  if (id) await db.creator.update({ where: { id }, data });
  else await db.creator.create({ data });
  published();
}

export async function deleteCreator(fd: FormData) {
  await requireAdmin();
  const id = text(fd, "id");
  // Coupons and links credited to the creator would block the delete; their itineraries go with them.
  await db.$transaction([
    db.coupon.deleteMany({ where: { creatorId: id } }),
    db.affiliateLink.deleteMany({ where: { creatorId: id } }),
    db.creator.delete({ where: { id } }),
  ]);
  published();
}

// Itineraries

export async function saveItinerary(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const data = {
    slug: slugify(text(fd, "slug") || text(fd, "title")),
    title: text(fd, "title"),
    summary: text(fd, "summary"),
    tier: text(fd, "tier") as Tier,
    days: Math.max(1, int(fd, "days", 1)),
    sourceUrl: text(fd, "sourceUrl"),
    creatorId: text(fd, "creatorId"),
  };
  const row = id
    ? await db.itinerary.update({ where: { id }, data })
    : await db.itinerary.create({ data: { ...data, destinationId: text(fd, "destinationId") } });
  published();
  if (!id) redirect(`/admin/itineraries/${row.id}`);
}

export async function deleteItinerary(fd: FormData) {
  await requireAdmin();
  const row = await db.itinerary.delete({ where: { id: text(fd, "id") } });
  published();
  redirect(`/admin/destinations/${row.destinationId}`);
}

// Items

export async function saveItem(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const itineraryId = text(fd, "itineraryId");
  const vendorId = optional(fd, "vendorId");
  const data = {
    day: Math.max(1, int(fd, "day", 1)),
    position: int(fd, "position"),
    name: text(fd, "name"),
    note: optional(fd, "note"),
    category: text(fd, "category") as ItemCategory,
    priceCents: cents(fd, "price"),
    priceNote: optional(fd, "priceNote"),
    priceSourceUrl: optional(fd, "priceSourceUrl"),
    sentiment: (optional(fd, "sentiment") as Sentiment | null) ?? null,
    currency: text(fd, "currency") || "USD",
    unit: optional(fd, "unit"),
    quantity: Math.max(1, int(fd, "quantity", 1)),
    placeId: optional(fd, "placeId"),
    vendorId,
  };
  const ourUrl = optional(fd, "ourUrl");

  const itemId = id
    ? (await db.item.update({ where: { id }, data })).id
    : (
        await db.item.create({
          data: {
            ...data,
            // Same id scheme as the seed, so carts can match items by id.
            id: await freeItemId(itineraryId, data.name),
            itineraryId,
          },
        })
      ).id;

  // Our booking link is the one AffiliateLink without a creator. A link needs a booking site.
  await db.affiliateLink.deleteMany({ where: { itemId, creatorId: null } });
  if (ourUrl && vendorId) await db.affiliateLink.create({ data: { itemId, vendorId, url: ourUrl } });
  published();
}

async function freeItemId(itineraryId: string, name: string) {
  const { slug } = await db.itinerary.findUniqueOrThrow({ where: { id: itineraryId }, select: { slug: true } });
  const base = `${slug}--${slugify(name) || "item"}`;
  const taken = new Set(
    (await db.item.findMany({ where: { id: { startsWith: base } }, select: { id: true } })).map((i) => i.id),
  );
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

export async function deleteItem(fd: FormData) {
  await requireAdmin();
  await db.item.delete({ where: { id: text(fd, "id") } });
  published();
}

// Vendors

export async function saveVendor(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const data = {
    slug: slugify(text(fd, "slug") || text(fd, "name")),
    name: text(fd, "name"),
    homepage: text(fd, "homepage"),
  };
  if (id) await db.vendor.update({ where: { id }, data });
  else await db.vendor.create({ data });
  published();
}

export async function deleteVendor(fd: FormData) {
  await requireAdmin();
  const id = text(fd, "id");
  await db.$transaction([
    db.item.updateMany({ where: { vendorId: id }, data: { vendorId: null } }),
    db.affiliateLink.deleteMany({ where: { vendorId: id } }),
    db.coupon.deleteMany({ where: { vendorId: id } }),
    db.vendor.delete({ where: { id } }),
  ]);
  published();
}

// Coupons

export async function saveCoupon(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const data = {
    code: text(fd, "code"),
    type: text(fd, "type") as CouponType,
    description: optional(fd, "description"),
    vendorId: text(fd, "vendorId"),
    creatorId: optional(fd, "creatorId"),
    validFrom: date(fd, "validFrom"),
    validTo: date(fd, "validTo"),
    active: checkbox(fd, "active"),
  };
  if (id) await db.coupon.update({ where: { id }, data });
  else await db.coupon.create({ data });
  published();
}

export async function deleteCoupon(fd: FormData) {
  await requireAdmin();
  await db.coupon.delete({ where: { id: text(fd, "id") } });
  published();
}

// eSIM plans

export async function saveEsimPlan(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const gb = text(fd, "dataGb");
  const hotspot = text(fd, "hotspot");
  const data = {
    country: text(fd, "country"),
    provider: text(fd, "provider"),
    name: text(fd, "name"),
    dataMb: gb === "" ? null : Math.round(Number.parseFloat(gb) * 1024),
    days: Math.max(1, int(fd, "days", 1)),
    priceCents: cents(fd, "price") ?? 0,
    currency: text(fd, "currency") || "USD",
    network: optional(fd, "network"),
    speed: optional(fd, "speed"),
    hotspot: hotspot === "" ? null : hotspot === "yes",
    notes: optional(fd, "notes"),
    url: text(fd, "url"),
    sourceUrl: optional(fd, "sourceUrl"),
    checkedAt: new Date(),
  };
  if (id) await db.esimPlan.update({ where: { id }, data });
  else await db.esimPlan.create({ data });
  published();
}

export async function deleteEsimPlan(fd: FormData) {
  await requireAdmin();
  await db.esimPlan.delete({ where: { id: text(fd, "id") } });
  published();
}

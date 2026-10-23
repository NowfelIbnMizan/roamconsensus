"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/data";
import { logIn, logOut, requireAdmin } from "@/lib/admin/auth";
import { SOCIALS, type SocialKey } from "@/lib/creator-links";
import { submitToIndexNow } from "@/lib/indexnow";
import { destinationPaths, sitePaths } from "@/lib/site-paths";
import type { CouponType, Crowd, ItemCategory, Platform, Sentiment, Tier } from "@/generated/prisma/enums";

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

/** Every save ends here: refresh the public site's cached pages, then tell Bing which pages changed. */
function published(paths: string[] = []) {
  updateTag(CONTENT_TAG);
  if (paths.length) after(() => submitToIndexNow(paths));
}

/** Marks a destination as just updated (its pages show "Updated <date>") and returns its page paths. */
async function destinationChanged(id: string) {
  const { slug } = await db.destination.update({
    where: { id },
    data: { updatedAt: new Date() },
    select: { slug: true },
  });
  return destinationPaths(slug);
}

async function itineraryChanged(id: string) {
  const it = await db.itinerary.update({
    where: { id },
    data: { updatedAt: new Date() },
    select: { slug: true, destinationId: true },
  });
  return [`/itineraries/${it.slug}`, ...(await destinationChanged(it.destinationId))];
}

/** Admin button: send every public page to IndexNow, e.g. after moving to a new domain. */
export async function submitAllToIndexNow(_: string | null) {
  await requireAdmin();
  return (await submitToIndexNow(await sitePaths()))
    ? "Sent every page to Bing."
    : "Bing didn't accept it. Try again later.";
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
  published(["/", ...destinationPaths(row.slug)]);
  if (!id) redirect(`/admin/destinations/${row.id}`);
}

export async function deleteDestination(fd: FormData) {
  await requireAdmin();
  await db.destination.delete({ where: { id: text(fd, "id") } });
  published();
  redirect("/admin");
}

// Best time to go: one form with a row per month. A row left blank removes that month.

export async function saveMonths(fd: FormData) {
  await requireAdmin();
  const destinationId = text(fd, "destinationId");
  const num = (key: string) => (text(fd, key) === "" ? null : int(fd, key));
  await db.destination.update({
    where: { id: destinationId },
    data: { climateSourceUrl: optional(fd, "climateSourceUrl") },
  });
  for (let month = 1; month <= 12; month++) {
    const data = {
      highC: num(`highC${month}`),
      lowC: num(`lowC${month}`),
      rainMm: num(`rainMm${month}`),
      crowd: (optional(fd, `crowd${month}`) as Crowd | null) ?? null,
      note: optional(fd, `note${month}`),
    };
    const where = { destinationId_month: { destinationId, month } };
    if (Object.values(data).every((v) => v === null))
      await db.destinationMonth.deleteMany({ where: { destinationId, month } });
    else await db.destinationMonth.upsert({ where, create: { ...data, destinationId, month }, update: data });
  }
  published(await destinationChanged(destinationId));
}

// Before you go

export async function saveTip(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const data = {
    topic: text(fd, "topic") || "General",
    title: text(fd, "title"),
    body: text(fd, "body"),
    sourceUrl: optional(fd, "sourceUrl"),
    position: int(fd, "position"),
  };
  const tip = id
    ? await db.destinationTip.update({ where: { id }, data })
    : await db.destinationTip.create({ data: { ...data, destinationId: text(fd, "destinationId") } });
  published(await destinationChanged(tip.destinationId));
}

export async function deleteTip(fd: FormData) {
  await requireAdmin();
  const tip = await db.destinationTip.delete({ where: { id: text(fd, "id") } });
  published(await destinationChanged(tip.destinationId));
}

// Places

export async function savePlace(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const data = {
    slug: slugify(text(fd, "slug") || text(fd, "name")),
    name: text(fd, "name"),
    category: text(fd, "category") as ItemCategory,
    area: optional(fd, "area"),
    blurb: optional(fd, "blurb"),
    tip: optional(fd, "tip"),
    website: optional(fd, "website"),
    // One link per line; anything that isn't an https link is dropped.
    photos: text(fd, "photos")
      .split(/\s+/)
      .filter((u) => URL.parse(u)?.protocol === "https:")
      .slice(0, 12),
    ...(await mapPin(text(fd, "pin"))),
  };
  const place = id
    ? await db.place.update({ where: { id }, data })
    : await db.place.create({ data: { ...data, destinationId: text(fd, "destinationId") } });
  published(await destinationChanged(place.destinationId));
}

/**
 * "Map pin" field: coordinates ("-8.5069, 115.2625") or a Google Maps link, including maps.app.goo.gl share links.
 * Blank clears the pin; anything unreadable leaves the saved pin alone.
 */
async function mapPin(input: string): Promise<{ lat?: number | null; lng?: number | null }> {
  if (!input) return { lat: null, lng: null };
  let s = input;
  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//.test(s)) {
    const res = await fetch(s, { redirect: "manual" }).catch(() => null);
    s = res?.headers.get("location") ?? s;
  }
  s = decodeURIComponent(s);
  // !3d!4d is the place itself; @lat,lng is only where the map was centred.
  const m =
    s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) ??
    s.match(/[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ??
    s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ??
    s.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return {};
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : {};
}

export async function deletePlace(fd: FormData) {
  await requireAdmin();
  const place = await db.place.delete({ where: { id: text(fd, "id") } });
  published(await destinationChanged(place.destinationId));
}

// Creators

export async function saveCreator(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const socials = Object.fromEntries(SOCIALS.map((s) => [s.key, optional(fd, s.key)])) as Record<
    SocialKey,
    string | null
  >;
  const data = {
    handle: text(fd, "handle")
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9.-]/g, ""),
    name: text(fd, "name"),
    platform: text(fd, "platform") as Platform,
    bio: optional(fd, "bio"),
    ...socials,
    // Blank main link falls back to the first social profile given.
    profileUrl: text(fd, "profileUrl") || SOCIALS.map((s) => socials[s.key]).find(Boolean) || "",
  };
  if (id) await db.creator.update({ where: { id }, data });
  else await db.creator.create({ data });
  published(["/creators", `/creators/${data.handle}`]);
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
    editorTake: optional(fd, "editorTake"),
    creatorId: text(fd, "creatorId"),
  };
  const row = id
    ? await db.itinerary.update({ where: { id }, data })
    : await db.itinerary.create({ data: { ...data, destinationId: text(fd, "destinationId") } });
  published([`/itineraries/${row.slug}`, ...(await destinationChanged(row.destinationId))]);
  if (!id) redirect(`/admin/itineraries/${row.id}`);
}

export async function deleteItinerary(fd: FormData) {
  await requireAdmin();
  const row = await db.itinerary.delete({ where: { id: text(fd, "id") } });
  published([`/itineraries/${row.slug}`, ...(await destinationChanged(row.destinationId))]);
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
  published(await itineraryChanged(itineraryId));
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
  const item = await db.item.delete({ where: { id: text(fd, "id") } });
  published(await itineraryChanged(item.itineraryId));
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

// About me

export async function saveEditor(fd: FormData) {
  await requireAdmin();
  const data = {
    name: text(fd, "name") || "Nowfel",
    tagline: optional(fd, "tagline"),
    bio: text(fd, "bio"),
    photoUrl: optional(fd, "photoUrl"),
    email: optional(fd, "email"),
    instagramUrl: optional(fd, "instagramUrl"),
  };
  await db.editor.upsert({ where: { id: "me" }, create: data, update: data });
  published();
}

// Blog

export async function savePost(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const live = checkbox(fd, "published");
  const before = id ? await db.post.findUnique({ where: { id }, select: { publishedAt: true } }) : null;
  const data = {
    slug: slugify(text(fd, "slug") || text(fd, "title")),
    title: text(fd, "title"),
    excerpt: optional(fd, "excerpt"),
    body: text(fd, "body"),
    coverUrl: optional(fd, "coverUrl"),
    destinationId: optional(fd, "destinationId"),
    published: live,
    // The first time a post goes live sets its date; later edits keep it.
    publishedAt: before?.publishedAt ?? (live ? new Date() : null),
  };
  const row = id ? await db.post.update({ where: { id }, data }) : await db.post.create({ data });
  // Drafts refresh the cache (a post taken offline must disappear) but aren't announced to Bing.
  published(row.published ? ["/blog", `/blog/${row.slug}`] : []);
  if (!id) redirect(`/admin/blog/${row.id}`);
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const row = await db.post.delete({ where: { id: text(fd, "id") } });
  published(["/blog", `/blog/${row.slug}`]);
  redirect("/admin/blog");
}

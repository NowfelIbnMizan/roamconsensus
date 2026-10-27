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
import type {
  CouponType,
  Crowd,
  ItemCategory,
  PhotoSource,
  Platform,
  Sentiment,
  Tier,
} from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { findPhoto } from "@/lib/photos";
import { placePhotoKey, placeQuery } from "@/lib/place";
import { ImportData } from "@/lib/content-schema";
import { checkContent } from "@/lib/content-check";
import { loadItinerary } from "@/lib/content-load";

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
const date = (fd: FormData, key: string) =>
  text(fd, key) ? new Date(text(fd, key)) : null;
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
  return [
    `/itineraries/${it.slug}`,
    ...(await destinationChanged(it.destinationId)),
  ];
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
  const row = id
    ? await db.destination.update({ where: { id }, data })
    : await db.destination.create({ data });
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
    else
      await db.destinationMonth.upsert({
        where,
        create: { ...data, destinationId, month },
        update: data,
      });
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
    : await db.destinationTip.create({
        data: { ...data, destinationId: text(fd, "destinationId") },
      });
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
    closed: checkbox(fd, "closed"),
    ...(checkbox(fd, "checkedNow") && { checkedAt: new Date() }),
  };
  const place = id
    ? await db.place.update({ where: { id }, data })
    : await db.place.create({
        data: { ...data, destinationId: text(fd, "destinationId") },
      });
  await saveOwnPhoto(place);
  published(await destinationChanged(place.destinationId));
}

/** The first photo link typed in admin replaces the stock photo; clearing the links lets the stock search run again. */
async function saveOwnPhoto(place: {
  slug: string;
  destinationId: string;
  photos: string[];
}) {
  const { slug } = await db.destination.findUniqueOrThrow({
    where: { id: place.destinationId },
    select: { slug: true },
  });
  // Both variants, so the photo sticks even if the website field is added or cleared later.
  const keys = [
    placePhotoKey(slug, { slug: place.slug, website: null }),
    placePhotoKey(slug, { slug: place.slug, website: "x" }),
  ];
  const [url] = place.photos;
  if (!url) {
    await db.photoCache.deleteMany({
      where: { key: { in: keys }, source: "MANUAL" },
    });
    return;
  }
  const row = {
    url,
    source: "MANUAL" as const,
    attribution: null,
    creditUrl: null,
    fetchedAt: new Date(),
  };
  await Promise.all(
    keys.map((key) =>
      db.photoCache.upsert({
        where: { key },
        create: { key, ...row },
        update: row,
      }),
    ),
  );
}

/** Photos found before the match check, re-searched in small batches so the free Unsplash limit isn't hit. */
const RECHECK_SINCE = new Date("2026-10-25T00:00:00Z");
const RECHECK_BATCH = 20;

export async function recheckPhotos(_: string | null) {
  await requireAdmin();
  const stale = {
    key: { startsWith: "place:" },
    NOT: { key: { contains: "#" } },
    source: { in: ["UNSPLASH", "PEXELS"] as PhotoSource[] },
    fetchedAt: { lt: RECHECK_SINCE },
  };
  const rows = await db.photoCache.findMany({
    where: stale,
    take: RECHECK_BATCH,
    orderBy: { key: "asc" },
  });
  let changed = 0;
  let done = 0;
  for (const row of rows) {
    const [, dest, slug] = row.key.split(":");
    const place = await db.place.findFirst({
      where: { slug, destination: { slug: dest } },
      select: {
        name: true,
        category: true,
        website: true,
        destination: { select: { name: true } },
      },
    });
    if (!place) {
      await db.photoCache.delete({ where: { key: row.key } });
      done++;
      continue;
    }
    // Expire the row so findPhoto searches again with the match check.
    await db.photoCache.update({
      where: { key: row.key },
      data: { fetchedAt: new Date(0) },
    });
    const photo = await findPhoto({
      key: row.key,
      query: placeQuery(place.name, place.destination.name),
      category: place.category,
      website: row.key.endsWith(":site") ? place.website : null,
    });
    const fresh = await db.photoCache.findUnique({ where: { key: row.key } });
    if (!fresh || fresh.fetchedAt.getTime() === 0) {
      // Provider down or rate-limited: put the old photo back and stop for now.
      await db.photoCache.update({
        where: { key: row.key },
        data: { fetchedAt: row.fetchedAt },
      });
      break;
    }
    await db.photoCache.deleteMany({
      where: { key: { startsWith: `${row.key}#` } },
    });
    if (photo.url !== row.url) changed++;
    done++;
  }
  const left = await db.photoCache.count({ where: stale });
  if (done) published([]);
  if (!done && rows.length)
    return "Photo search is busy (free limit). Try again in an hour.";
  return left
    ? `Checked ${done}, changed ${changed}. ${left} left: press again in an hour.`
    : `Checked ${done}, changed ${changed}. All photos checked.`;
}

/**
 * "Map pin" field: coordinates ("-8.5069, 115.2625") or a Google Maps link, including maps.app.goo.gl share links.
 * Blank clears the pin; anything unreadable leaves the saved pin alone.
 */
async function mapPin(
  input: string,
): Promise<{ lat?: number | null; lng?: number | null }> {
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
    s.match(
      /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    ) ??
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
  const socials = Object.fromEntries(
    SOCIALS.map((s) => [s.key, optional(fd, s.key)]),
  ) as Record<SocialKey, string | null>;
  const avatarUrl = optional(fd, "avatarUrl");
  const data = {
    handle: text(fd, "handle")
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9.-]/g, ""),
    name: text(fd, "name"),
    platform: text(fd, "platform") as Platform,
    bio: optional(fd, "bio"),
    // Only ever a photo the creator agreed to; https so it never breaks the page's mixed-content rules.
    avatarUrl: avatarUrl?.startsWith("https://") ? avatarUrl : null,
    ...socials,
    // Blank main link falls back to the first social profile given.
    profileUrl:
      text(fd, "profileUrl") ||
      SOCIALS.map((s) => socials[s.key]).find(Boolean) ||
      "",
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
    : await db.itinerary.create({
        data: { ...data, destinationId: text(fd, "destinationId") },
      });
  published([
    `/itineraries/${row.slug}`,
    ...(await destinationChanged(row.destinationId)),
  ]);
  if (!id) redirect(`/admin/itineraries/${row.id}`);
}

export async function deleteItinerary(fd: FormData) {
  await requireAdmin();
  const row = await db.itinerary.delete({ where: { id: text(fd, "id") } });
  published([
    `/itineraries/${row.slug}`,
    ...(await destinationChanged(row.destinationId)),
  ]);
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
  // A researched price is dated when it (or its source) changes, so "checked Oct 2026" stays honest.
  const before = id
    ? await db.item.findUnique({
        where: { id },
        select: {
          priceCents: true,
          priceSourceUrl: true,
          priceCheckedAt: true,
        },
      })
    : null;
  const priceCheckedAt = !data.priceSourceUrl
    ? null
    : before &&
        before.priceCents === data.priceCents &&
        before.priceSourceUrl === data.priceSourceUrl
      ? before.priceCheckedAt
      : new Date();

  const itemId = id
    ? (
        await db.item.update({
          where: { id },
          data: { ...data, priceCheckedAt },
        })
      ).id
    : (
        await db.item.create({
          data: {
            ...data,
            priceCheckedAt,
            // Same id scheme as the seed, so carts can match items by id.
            id: await freeItemId(itineraryId, data.name),
            itineraryId,
          },
        })
      ).id;

  // Our booking link is the one AffiliateLink without a creator. A link needs a booking site.
  await db.affiliateLink.deleteMany({ where: { itemId, creatorId: null } });
  if (ourUrl && vendorId)
    await db.affiliateLink.create({ data: { itemId, vendorId, url: ourUrl } });
  published(await itineraryChanged(itineraryId));
}

async function freeItemId(itineraryId: string, name: string) {
  const { slug } = await db.itinerary.findUniqueOrThrow({
    where: { id: itineraryId },
    select: { slug: true },
  });
  const base = `${slug}--${slugify(name) || "item"}`;
  const taken = new Set(
    (
      await db.item.findMany({
        where: { id: { startsWith: base } },
        select: { id: true },
      })
    ).map((i) => i.id),
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
  const before = id
    ? await db.post.findUnique({ where: { id }, select: { publishedAt: true } })
    : null;
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
  const row = id
    ? await db.post.update({ where: { id }, data })
    : await db.post.create({ data });
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

// Import: paste itineraries in the data/ format (see data/README.md), check them, then add them.

export type ImportResult = {
  problems: string[];
  warnings: string[];
  summary: string;
  /** Links to the itineraries just added; empty after a check. */
  added: { title: string; href: string }[];
} | null;

export async function importItineraries(
  _: ImportResult,
  fd: FormData,
): Promise<ImportResult> {
  await requireAdmin();
  const destinationId = text(fd, "destinationId");
  const save = text(fd, "mode") === "import";
  const fail = (problem: string) => ({
    problems: [problem],
    warnings: [],
    summary: "",
    added: [],
  });

  let raw: unknown;
  try {
    raw = JSON.parse(text(fd, "json"));
  } catch (e) {
    return fail(`That isn't valid JSON: ${e instanceof Error ? e.message : e}`);
  }
  // One itinerary on its own is fine too.
  if (raw && typeof raw === "object" && "items" in raw)
    raw = { itineraries: [raw] };
  const parsed = ImportData.safeParse(raw);
  if (!parsed.success)
    return {
      problems: parsed.error.issues
        .slice(0, 20)
        .map((i) => `${i.path.join(".") || "file"}: ${i.message}`),
      warnings: [],
      summary: "",
      added: [],
    };
  const { places, creators, itineraries } = parsed.data;

  const dest = await db.destination.findUniqueOrThrow({
    where: { id: destinationId },
    include: { places: true },
  });
  const [dbCreators, vendors, taken] = await Promise.all([
    db.creator.findMany({ select: { id: true, handle: true } }),
    db.vendor.findMany({ select: { id: true, slug: true } }),
    db.itinerary.findMany({
      where: { slug: { in: itineraries.map((it) => it.slug) } },
      select: { slug: true },
    }),
  ]);

  const problems: string[] = [];
  const dbPlaces = new Map(dest.places.map((p) => [p.slug, p]));
  const dbPlaceNames = new Map(
    dest.places.map((p) => [p.name.trim().toLowerCase(), p.slug]),
  );
  const newPlaces = places.filter((p) => !dbPlaces.has(p.slug));
  for (const p of newPlaces) {
    const same = dbPlaceNames.get(p.name.trim().toLowerCase());
    if (same)
      problems.push(
        `Place "${p.name}" already exists as "${same}"; point the items at that slug instead.`,
      );
  }
  const creatorHandles = new Set([
    ...dbCreators.map((c) => c.handle),
    ...creators.map((c) => c.handle),
  ]);
  const vendorSlugs = new Set(vendors.map((v) => v.slug));
  const placeSlugs = new Set([
    ...dbPlaces.keys(),
    ...newPlaces.map((p) => p.slug),
  ]);
  for (const t of taken)
    problems.push(
      `An itinerary called "${t.slug}" already exists; give this one another slug.`,
    );
  for (const it of itineraries) {
    if (!creatorHandles.has(it.creator))
      problems.push(
        `${it.slug}: creator "${it.creator}" is new; add them under "creators" (or on the Creators page).`,
      );
    for (const i of it.items) {
      if (i.place && !placeSlugs.has(i.place))
        problems.push(
          `${it.slug} "${i.name}": place "${i.place}" isn't in ${dest.name}; add it under "places".`,
        );
      if (i.vendor && !vendorSlugs.has(i.vendor))
        problems.push(
          `${it.slug} "${i.name}": unknown booking site "${i.vendor}".`,
        );
      if ((i.ourUrl || i.creatorUrl) && !i.vendor)
        problems.push(`${it.slug} "${i.name}": booking links need a "vendor".`);
    }
  }

  // The same checks as `npm run check:data`, on the new itineraries and the places they use.
  const used = new Set(
    itineraries.flatMap((it) =>
      it.items.flatMap((i) => (i.place ? [i.place] : [])),
    ),
  );
  const quality = checkContent(
    {
      slug: dest.slug,
      places: [
        ...newPlaces,
        ...dest.places
          .filter((p) => used.has(p.slug))
          .map((p) => ({
            ...p,
            lat: p.lat ?? undefined,
            lng: p.lng ?? undefined,
            website: p.website ?? undefined,
          })),
      ],
      itineraries,
    },
    { unusedPlaces: false },
  );
  problems.push(...quality.problems);

  const stops = itineraries.reduce((n, it) => n + it.items.length, 0);
  const summary =
    `${itineraries.length} itinerar${itineraries.length === 1 ? "y" : "ies"} with ${stops} stops` +
    `, ${newPlaces.length} new place${newPlaces.length === 1 ? "" : "s"}` +
    `, ${creators.filter((c) => !dbCreators.some((d) => d.handle === c.handle)).length} new creator(s).`;
  if (!save || problems.length)
    return { problems, warnings: quality.warnings, summary, added: [] };

  const placeIds = new Map(dest.places.map((p) => [p.slug, p.id]));
  for (const p of newPlaces)
    placeIds.set(
      p.slug,
      (await db.place.create({ data: { ...p, destinationId: dest.id } })).id,
    );
  const creatorIds = new Map(dbCreators.map((c) => [c.handle, c.id]));
  for (const c of creators)
    if (!creatorIds.has(c.handle))
      creatorIds.set(c.handle, (await db.creator.create({ data: c })).id);
  const vendorIds = new Map(vendors.map((v) => [v.slug, v.id]));
  for (const it of itineraries)
    await loadItinerary(db, it, dest.id, creatorIds, placeIds, vendorIds);
  // So a later deploy with the same itinerary in data/ doesn't add it twice.
  await db.seedLog.createMany({
    data: itineraries.map((it) => ({ key: `itinerary:${it.slug}` })),
    skipDuplicates: true,
  });
  published([
    ...itineraries.map((it) => `/itineraries/${it.slug}`),
    ...(await destinationChanged(dest.id)),
  ]);
  return {
    problems: [],
    warnings: quality.warnings,
    summary: `Added ${summary}`,
    added: itineraries.map((it) => ({
      title: it.title,
      href: `/itineraries/${it.slug}`,
    })),
  };
}

// Budgets, eSIM guides and About photos (content that used to live in code)

const lines = (fd: FormData, key: string) =>
  text(fd, key)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export async function saveCostGuide(fd: FormData) {
  await requireAdmin();
  const id = text(fd, "id");
  const num = (k: string) => Number(text(fd, k)) || 0;
  const styles = Object.fromEntries(
    ["backpacker", "midrange", "luxury"].map((s) => [
      s,
      {
        food: num(`${s}.food`),
        localTransport: num(`${s}.localTransport`),
        activities: num(`${s}.activities`),
        stayPerNight: num(`${s}.stayPerNight`),
      },
    ]),
  );
  const empty = Object.values(styles).every((s) => Object.values(s).every((v) => v === 0));
  await db.destination.update({
    where: { id },
    data: { costGuide: empty ? Prisma.DbNull : { checked: text(fd, "checked"), styles, sources: lines(fd, "sources") } },
  });
  published(await destinationChanged(id));
}

export async function saveEsimGuide(fd: FormData) {
  await requireAdmin();
  const country = text(fd, "country");
  if (!country) return;
  const data = {
    checked: text(fd, "checked"),
    imei: { title: text(fd, "imeiTitle"), body: lines(fd, "imeiBody"), sources: lines(fd, "imeiSources") },
    coverage: {
      intro: text(fd, "coverageIntro"),
      // "Name: note", one area per line.
      areas: lines(fd, "areas").map((l) => {
        const at = l.indexOf(":");
        return at < 0 ? { name: l, note: "" } : { name: l.slice(0, at).trim(), note: l.slice(at + 1).trim() };
      }),
      sources: lines(fd, "coverageSources"),
    },
    // Blocks split by a blank line; first line is the question, the rest the answer.
    faq: text(fd, "faq")
      .split(/\n\s*\n/)
      .map((b) => b.trim().split("\n"))
      .filter((b) => b[0])
      .map(([q, ...a]) => ({ q: q.replace(/^Q:\s*/i, "").trim(), a: a.join(" ").replace(/^A:\s*/i, "").trim() })),
  };
  await db.esimGuide.upsert({ where: { country }, create: { country, data }, update: { data } });
  published();
}

export async function saveAboutPhoto(fd: FormData) {
  await requireAdmin();
  const id = optional(fd, "id");
  const data = {
    src: text(fd, "src"),
    alt: text(fd, "alt") || text(fd, "caption"),
    caption: text(fd, "caption"),
    wide: text(fd, "shape") === "wide",
    position: int(fd, "position"),
  };
  if (!data.src) return;
  if (id) await db.aboutPhoto.update({ where: { id }, data });
  else await db.aboutPhoto.create({ data });
  published();
}

export async function deleteAboutPhoto(fd: FormData) {
  await requireAdmin();
  await db.aboutPhoto.delete({ where: { id: text(fd, "id") } });
  published();
}

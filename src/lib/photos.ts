import { cacheLife } from "next/cache";
import { db } from "@/lib/db";
import { getEmbed } from "@/lib/oembed";
import type { PhotoSource } from "@/generated/prisma/enums";

export const placeholderCategories = ["DESTINATION", "STAY", "EXPERIENCE", "FOOD", "ESIM", "GEAR", "TRANSIT"] as const;
export type PlaceholderCategory = (typeof placeholderCategories)[number];

export type Photo = {
  url: string;
  source: PhotoSource;
  attribution: string | null;
  creditUrl: string | null;
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Lookup = {
  key: string;
  query: string;
  category: PlaceholderCategory;
  postUrl?: string;
  website?: string | null;
};

// OTA content APIs (Agoda, Booking, Klook) need partner credentials; plug them in here first when available.
async function fromOta(): Promise<Photo | null> {
  return null;
}

async function fromOEmbed(postUrl?: string): Promise<Photo | null> {
  if (!postUrl) return null;
  const embed = await getEmbed(postUrl);
  return embed?.thumbnailUrl
    ? {
        url: embed.thumbnailUrl,
        source: "OEMBED",
        attribution: embed.authorName ? `Post by ${embed.authorName}` : null,
        creditUrl: postUrl,
      }
    : null;
}

const META_IMAGE_TAG = /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/gi;
const CONTENT_ATTR = /content=["']([^"']+)["']/i;

/** The venue's own share image (og:image / twitter:image) from its homepage. */
async function fromWebsite(website?: string | null): Promise<Photo | null> {
  if (!website) return null;
  const res = await fetch(website, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Creatour/1.0; +https://creatour.co)" },
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res?.ok || !res.headers.get("content-type")?.includes("html")) {
    console.warn(
      `[photos] website ${website}: ${res ? `HTTP ${res.status} ${res.headers.get("content-type")}` : "fetch failed"}`,
    );
    return null;
  }
  const html = (await res.text().catch(() => "")).slice(0, 300_000);
  for (const tag of html.match(META_IMAGE_TAG) ?? []) {
    const raw = tag.match(CONTENT_ATTR)?.[1]?.replace(/&amp;/g, "&");
    const url = raw ? URL.parse(raw, res.url) : null;
    if (url?.protocol !== "https:") continue;
    const host = new URL(website).hostname.replace(/^www\./, "");
    return { url: url.href, source: "WEBSITE", attribution: `Photo from ${host}`, creditUrl: website };
  }
  console.warn(`[photos] website ${website}: no og:image`);
  return null;
}

async function fromUnsplash(query: string): Promise<Photo | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
      signal: AbortSignal.timeout(5000),
    },
  ).catch(() => null);
  if (!res?.ok) {
    console.warn(
      `[photos] unsplash "${query}": ${res ? `HTTP ${res.status}, ${res.headers.get("x-ratelimit-remaining") ?? "?"} left this hour` : "fetch failed"}`,
    );
    return null;
  }
  const photo = (await res.json()).results?.[0];
  if (!photo) return null;
  // Unsplash API terms: report each photo we start using via its download endpoint.
  await fetch(photo.links.download_location, {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  return {
    url: photo.urls.regular,
    source: "UNSPLASH",
    attribution: `Photo by ${photo.user.name} on Unsplash`,
    creditUrl: `${photo.user.links.html}?utm_source=creatour&utm_medium=referral`,
  };
}

async function fromPexels(query: string): Promise<Photo | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://api.pexels.com/v1/search?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(5000),
    },
  ).catch(() => null);
  if (!res?.ok) return null;
  const photo = (await res.json()).photos?.[0];
  return photo
    ? {
        url: photo.src.large,
        source: "PEXELS",
        attribution: `Photo by ${photo.photographer} on Pexels`,
        creditUrl: photo.photographer_url,
      }
    : null;
}

/** Fallback chain: cache → OTA → venue website → oEmbed thumbnail → Unsplash → Pexels → category placeholder. */
export async function findPhoto({ key, query, category, postUrl, website }: Lookup): Promise<Photo> {
  const cached = await db.photoCache.findUnique({ where: { key } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
    return {
      url: cached.url,
      source: cached.source,
      attribution: cached.attribution,
      creditUrl: cached.creditUrl,
    };
  }

  const found =
    (await fromOta()) ??
    (await fromWebsite(website)) ??
    (await fromOEmbed(postUrl)) ??
    (await fromUnsplash(query)) ??
    (await fromPexels(query));

  if (!found) {
    return {
      url: `/placeholders/${category.toLowerCase()}.svg`,
      source: "PLACEHOLDER",
      attribution: null,
      creditUrl: null,
    };
  }

  await db.photoCache.upsert({
    where: { key },
    create: { key, ...found },
    update: { ...found, fetchedAt: new Date() },
  });
  return found;
}

/**
 * Photo links already found for these keys, without asking any provider. For lists of many stops (itineraries,
 * carts) where a missing photo just shows the category tile.
 */
export async function cachedPhotoUrls(keys: string[]) {
  if (!keys.length) return new Map<string, string>();
  const rows = await db.photoCache.findMany({
    where: { key: { in: [...new Set(keys)] }, source: { not: "PLACEHOLDER" } },
    select: { key: true, url: true },
  });
  return new Map(rows.map((r) => [r.key, r.url]));
}

/** Cached lookup for server components, so prerendered pages don't re-query providers. */
export async function getPhoto(lookup: Lookup): Promise<Photo> {
  "use cache";
  const photo = await findPhoto(lookup);
  // A placeholder usually means a provider was down or rate-limited, so retry within the hour instead of keeping it for days.
  if (photo.source === "PLACEHOLDER") cacheLife("hours");
  else cacheLife("days");
  return photo;
}

const GALLERY_SIZE = 5;

/**
 * More shots of a place for its photo gallery: up to five Unsplash results besides the main photo, cached for a week
 * as "<key>#2" … "<key>#6". Fetched on demand from the place page (not at build) to stay inside Unsplash's hourly limit.
 */
export async function findGallery(key: string, query: string, mainUrl?: string): Promise<Photo[]> {
  const cached = await db.photoCache.findMany({ where: { key: { startsWith: `${key}#` } }, orderBy: { key: "asc" } });
  if (cached.length && Date.now() - cached[0].fetchedAt.getTime() < CACHE_TTL_MS)
    return cached.map(({ url, source, attribution, creditUrl }) => ({ url, source, attribution, creditUrl }));

  const auth = process.env.UNSPLASH_ACCESS_KEY;
  if (!auth) return [];
  const headers = { Authorization: `Client-ID ${auth}`, "Accept-Version": "v1" };
  const res = await fetch(
    `https://api.unsplash.com/search/photos?per_page=${GALLERY_SIZE + 1}&orientation=landscape&query=${encodeURIComponent(query)}`,
    { headers, signal: AbortSignal.timeout(5000) },
  ).catch(() => null);
  if (!res?.ok) {
    console.warn(`[photos] unsplash gallery "${query}": ${res ? `HTTP ${res.status}` : "fetch failed"}`);
    return [];
  }
  type Result = {
    urls: { regular: string };
    links: { download_location: string };
    user: { name: string; links: { html: string } };
  };
  const results = ((await res.json()).results ?? []) as Result[];
  const photos = results.filter((r) => r.urls.regular !== mainUrl).slice(0, GALLERY_SIZE);
  // Unsplash API terms: report each photo we start using via its download endpoint.
  await Promise.all(
    photos.map((r) =>
      fetch(r.links.download_location, { headers, signal: AbortSignal.timeout(5000) }).catch(() => null),
    ),
  );
  const gallery: Photo[] = photos.map((r) => ({
    url: r.urls.regular,
    source: "UNSPLASH",
    attribution: `Photo by ${r.user.name} on Unsplash`,
    creditUrl: `${r.user.links.html}?utm_source=creatour&utm_medium=referral`,
  }));
  await db.$transaction([
    db.photoCache.deleteMany({ where: { key: { startsWith: `${key}#` } } }),
    ...gallery.map((p, i) => db.photoCache.create({ data: { key: `${key}#${i + 2}`, ...p } })),
  ]);
  return gallery;
}

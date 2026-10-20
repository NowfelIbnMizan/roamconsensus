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
    headers: { "User-Agent": "Mozilla/5.0 (compatible; RoamConsensus/1.0; +https://roamconsensus-3arq.netlify.app)" },
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res?.ok || !res.headers.get("content-type")?.includes("html")) return null;
  const html = (await res.text().catch(() => "")).slice(0, 300_000);
  for (const tag of html.match(META_IMAGE_TAG) ?? []) {
    const raw = tag.match(CONTENT_ATTR)?.[1]?.replace(/&amp;/g, "&");
    const url = raw ? URL.parse(raw, res.url) : null;
    if (url?.protocol !== "https:") continue;
    const host = new URL(website).hostname.replace(/^www\./, "");
    return { url: url.href, source: "WEBSITE", attribution: `Photo from ${host}`, creditUrl: website };
  }
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
  if (!res?.ok) return null;
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
    creditUrl: `${photo.user.links.html}?utm_source=roamconsensus&utm_medium=referral`,
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
    (await fromOta()) ?? (await fromWebsite(website)) ?? (await fromOEmbed(postUrl)) ?? (await fromUnsplash(query)) ?? (await fromPexels(query));

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

/** Cached lookup for server components, so prerendered pages don't re-query providers. */
export async function getPhoto(lookup: Lookup): Promise<Photo> {
  "use cache";
  cacheLife("days");
  return findPhoto(lookup);
}

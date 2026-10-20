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

/** Fallback chain: cache → OTA → oEmbed thumbnail → Unsplash → Pexels → category placeholder. */
export async function findPhoto({ key, query, category, postUrl }: Lookup): Promise<Photo> {
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
    (await fromOta()) ?? (await fromOEmbed(postUrl)) ?? (await fromUnsplash(query)) ?? (await fromPexels(query));

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

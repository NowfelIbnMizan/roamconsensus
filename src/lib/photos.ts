import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { getEmbed } from "@/lib/oembed";
import type { PhotoSource } from "@/generated/prisma/enums";
import { PLACE_SEP } from "@/lib/place";

export const placeholderCategories = [
  "DESTINATION",
  "STAY",
  "EXPERIENCE",
  "FOOD",
  "ESIM",
  "GEAR",
  "TRANSIT",
] as const;
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

// Words that say what kind of place it is, not which one: "Paradise Beach" is only told apart by "paradise".
const GENERIC = new Set(
  (
    "the of and at in on by to a an de la le " +
    "beach beaches temple temples market markets night street food restaurant cafe coffee bar bars hotel resort spa " +
    "park garden gardens museum bay island islands waterfall falls hill hills mountain mount view viewpoint point " +
    "tour tours day trip walk area old new town city district shrine tower bridge river lake house hall station " +
    "square road mall centre center village cave sunset sunrise hike dinner lunch breakfast class cooking show " +
    "entrance fee pass ticket club seafood local best top big great grand little"
  ).split(" "),
);
const fold = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** The words a stock photo must mention to count as this place, or null when the query isn't for one place. */
function placeWords(query: string): string[] | null {
  const [name, city] = query.split(PLACE_SEP);
  if (city === undefined) return null;
  const cityWords = new Set(fold(city).split(/\W+/));
  const words = fold(name)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !cityWords.has(w));
  const distinctive = words.filter((w) => !GENERIC.has(w));
  return distinctive.length ? distinctive : words;
}

/** A stock photo counts when its caption, location, tags or slug name the place. */
function mentions(
  words: string[] | null,
  ...texts: (string | null | undefined)[]
) {
  if (!words) return true;
  const text = fold(texts.filter(Boolean).join(" ")).replace(
    /[^a-z0-9]+/g,
    " ",
  );
  return words.some((w) => ` ${text} `.includes(` ${w}`));
}

/** Photos other places in the same city already use, so two spots never share a picture. */
async function usedNearby(key: string) {
  const m = key.match(/^place:([^:]+):/);
  if (!m) return new Set<string>();
  const rows = await db.photoCache.findMany({
    where: {
      key: { startsWith: `place:${m[1]}:`, not: key },
      NOT: { key: { contains: "#" } },
    },
    select: { url: true },
  });
  return new Set(rows.map((r) => r.url.split("?")[0]));
}

// A search that worked but found nothing fitting, as opposed to a provider being down (null).
const NO_MATCH = "no-match" as const;

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

const META_IMAGE_TAG =
  /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/gi;
const CONTENT_ATTR = /content=["']([^"']+)["']/i;

/** The venue's own share image (og:image / twitter:image) from its homepage. */
async function fromWebsite(website?: string | null): Promise<Photo | null> {
  if (!website) return null;
  const res = await fetch(website, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Creatour/1.0; +https://creatour.co)",
    },
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
    return {
      url: url.href,
      source: "WEBSITE",
      attribution: `Photo from ${host}`,
      creditUrl: website,
    };
  }
  console.warn(`[photos] website ${website}: no og:image`);
  return null;
}

type UnsplashResult = {
  urls: { regular: string };
  links: { download_location: string };
  user: { name: string; links: { html: string } };
  slug?: string;
  description?: string | null;
  alt_description?: string | null;
  location?: { name?: string | null; title?: string | null } | null;
  tags?: { title?: string }[];
};
const unsplashText = (r: UnsplashResult) => [
  r.slug,
  r.description,
  r.alt_description,
  r.location?.name,
  r.location?.title,
  ...(r.tags ?? []).map((t) => t.title),
];

async function fromUnsplash(
  query: string,
  used: Set<string>,
): Promise<Photo | null | typeof NO_MATCH> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const words = placeWords(query);
  const res = await fetch(
    `https://api.unsplash.com/search/photos?per_page=${words ? 15 : 1}&orientation=landscape&query=${encodeURIComponent(query.replace(PLACE_SEP, " "))}`,
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
  const results = ((await res.json()).results ?? []) as UnsplashResult[];
  const photo = results.find(
    (r) =>
      mentions(words, ...unsplashText(r)) &&
      !used.has(r.urls.regular.split("?")[0]),
  );
  if (!photo) return NO_MATCH;
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

async function fromPexels(
  query: string,
  used: Set<string>,
): Promise<Photo | null | typeof NO_MATCH> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const words = placeWords(query);
  const res = await fetch(
    `https://api.pexels.com/v1/search?per_page=${words ? 15 : 1}&orientation=landscape&query=${encodeURIComponent(query.replace(PLACE_SEP, " "))}`,
    {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(5000),
    },
  ).catch(() => null);
  if (!res?.ok) return null;
  type Result = {
    alt?: string;
    url?: string;
    photographer: string;
    photographer_url: string;
    src: { large: string };
  };
  const photo = (((await res.json()).photos ?? []) as Result[]).find(
    (r) =>
      mentions(words, r.alt, r.url) && !used.has(r.src.large.split("?")[0]),
  );
  return photo
    ? {
        url: photo.src.large,
        source: "PEXELS",
        attribution: `Photo by ${photo.photographer} on Pexels`,
        creditUrl: photo.photographer_url,
      }
    : NO_MATCH;
}

/** Fallback chain: cache → OTA → venue website → oEmbed thumbnail → Unsplash → Pexels → category placeholder. */
export async function findPhoto({
  key,
  query,
  category,
  postUrl,
  website,
}: Lookup): Promise<Photo> {
  const cached = await db.photoCache.findUnique({ where: { key } });
  // A photo picked in admin never expires; anything else is looked up again after a week.
  if (
    cached &&
    (cached.source === "MANUAL" ||
      Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS)
  ) {
    return {
      url: cached.url,
      source: cached.source,
      attribution: cached.attribution,
      creditUrl: cached.creditUrl,
    };
  }

  let found =
    (await fromOta()) ??
    (await fromWebsite(website)) ??
    (await fromOEmbed(postUrl));
  let noMatch = false;
  if (!found) {
    const used = await usedNearby(key);
    for (const search of [fromUnsplash, fromPexels]) {
      const r = await search(query, used);
      if (r === NO_MATCH) noMatch = true;
      else if (r) {
        found = r;
        break;
      }
    }
  }

  const placeholder: Photo = {
    url: `/placeholders/${category.toLowerCase()}.svg`,
    source: "PLACEHOLDER",
    attribution: null,
    creditUrl: null,
  };
  if (!found) {
    // No photo of this place exists in the stock libraries: remember that for a week rather than searching on every
    // visit. A provider that was down (no answer at all) is retried next time.
    if (noMatch)
      await db.photoCache.upsert({
        where: { key },
        create: { key, ...placeholder },
        update: { ...placeholder, fetchedAt: new Date() },
      });
    return placeholder;
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
  // Same tag as CONTENT_TAG in data.ts (not imported: data.ts imports this file), so a photo picked in admin shows at once.
  cacheTag("content");
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
export async function findGallery(
  key: string,
  query: string,
  mainUrl?: string,
): Promise<Photo[]> {
  const cached = await db.photoCache.findMany({
    where: { key: { startsWith: `${key}#` } },
    orderBy: { key: "asc" },
  });
  if (
    cached.length &&
    Date.now() - cached[0].fetchedAt.getTime() < CACHE_TTL_MS
  )
    return cached.map(({ url, source, attribution, creditUrl }) => ({
      url,
      source,
      attribution,
      creditUrl,
    }));

  const auth = process.env.UNSPLASH_ACCESS_KEY;
  if (!auth) return [];
  const headers = {
    Authorization: `Client-ID ${auth}`,
    "Accept-Version": "v1",
  };
  const res = await fetch(
    `https://api.unsplash.com/search/photos?per_page=15&orientation=landscape&query=${encodeURIComponent(query.replace(PLACE_SEP, " "))}`,
    { headers, signal: AbortSignal.timeout(5000) },
  ).catch(() => null);
  if (!res?.ok) {
    console.warn(
      `[photos] unsplash gallery "${query}": ${res ? `HTTP ${res.status}` : "fetch failed"}`,
    );
    return [];
  }
  const words = placeWords(query);
  const results = ((await res.json()).results ?? []) as UnsplashResult[];
  const photos = results
    .filter(
      (r) => r.urls.regular !== mainUrl && mentions(words, ...unsplashText(r)),
    )
    .slice(0, GALLERY_SIZE);
  // Unsplash API terms: report each photo we start using via its download endpoint.
  await Promise.all(
    photos.map((r) =>
      fetch(r.links.download_location, {
        headers,
        signal: AbortSignal.timeout(5000),
      }).catch(() => null),
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
    ...gallery.map((p, i) =>
      db.photoCache.create({ data: { key: `${key}#${i + 2}`, ...p } }),
    ),
  ]);
  return gallery;
}

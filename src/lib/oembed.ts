import { cacheLife } from "next/cache";

export type Embed = {
  provider: "youtube" | "tiktok" | "instagram";
  html: string;
  title: string | null;
  authorName: string | null;
  thumbnailUrl: string | null;
};

const providers = [
  { name: "youtube", hosts: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"], endpoint: (u: string) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}` },
  { name: "tiktok", hosts: ["tiktok.com", "www.tiktok.com", "m.tiktok.com"], endpoint: (u: string) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}` },
  {
    name: "instagram",
    hosts: ["instagram.com", "www.instagram.com"],
    // Meta requires an app access token (app-id|client-token) for Instagram oEmbed.
    endpoint: (u: string) =>
      process.env.META_OEMBED_TOKEN
        ? `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(u)}&access_token=${process.env.META_OEMBED_TOKEN}`
        : null,
  },
] as const;

/** Only URLs on known providers are fetched, so this can't be used to proxy arbitrary hosts. */
export function providerFor(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  return providers.find((p) => (p.hosts as readonly string[]).includes(url.hostname)) ?? null;
}

export async function getEmbed(postUrl: string): Promise<Embed | null> {
  "use cache";
  cacheLife("days");

  const provider = providerFor(postUrl);
  const endpoint = provider?.endpoint(postUrl);
  if (!provider || !endpoint) return null;

  const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) }).catch(() => null);
  if (!res?.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  if (typeof data.html !== "string") return null;

  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    provider: provider.name,
    html: data.html,
    title: str(data.title),
    authorName: str(data.author_name),
    thumbnailUrl: str(data.thumbnail_url),
  };
}

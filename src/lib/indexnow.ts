import { siteUrl } from "@/lib/email";

/**
 * IndexNow key: INDEXNOW_KEY if set, else a fixed random one. The key is public by design (/indexnow-key.txt), so it
 * must never be derived from a secret: a hash of the admin password published there could be cracked offline.
 */
export function indexNowKey() {
  return process.env.INDEXNOW_KEY ?? "aede5f15fa47db86901eeabdeafda241";
}

/**
 * Tells Bing (and through it ChatGPT search, Copilot, Yandex and others) that these pages changed, so they re-read
 * them within hours instead of weeks. Paths are site-relative. Failures are ignored: it's only a hint.
 */
export async function submitToIndexNow(paths: string[]) {
  const base = siteUrl();
  const host = new URL(base).host;
  if (!paths.length || host.startsWith("localhost") || host.startsWith("127.")) return false;
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: indexNowKey(),
      keyLocation: `${base}/indexnow-key.txt`,
      urlList: [...new Set(paths)].slice(0, 10_000).map((p) => `${base}${p === "/" ? "" : p}`),
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  return Boolean(res && res.status < 300);
}

import { createHash } from "node:crypto";
import { siteUrl } from "@/lib/email";

/** IndexNow key: INDEXNOW_KEY if set, else derived from ADMIN_PASSWORD so it stays stable without extra setup. */
export function indexNowKey() {
  return (
    process.env.INDEXNOW_KEY ??
    createHash("sha256")
      .update(`indexnow:${process.env.ADMIN_PASSWORD ?? "roamconsensus"}`)
      .digest("hex")
      .slice(0, 32)
  );
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

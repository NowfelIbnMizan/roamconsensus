/** The video id in a YouTube link (watch, youtu.be, shorts, live, embed), or null for anything else. */
export function youtubeId(url: string | null | undefined) {
  const u = url ? URL.parse(url.trim()) : null;
  if (!u) return null;
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  const id =
    host === "youtu.be"
      ? u.pathname.slice(1)
      : host === "youtube.com" || host === "youtube-nocookie.com"
        ? (u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1])
        : null;
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** Start time from a link's t= or start= ("90", "1m30s"), in seconds. */
export function youtubeStart(url: string) {
  const t = URL.parse(url)?.searchParams;
  const raw = t?.get("t") ?? t?.get("start");
  if (!raw) return 0;
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

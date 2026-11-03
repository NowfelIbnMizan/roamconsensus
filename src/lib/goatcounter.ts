// Visitor numbers from GoatCounter's API, for Admin > Visitors. Needs GOATCOUNTER_CODE (already used for counting)
// and GOATCOUNTER_API_TOKEN (GoatCounter > username in the top menu > API, read-only stats permission). Read-only:
// this never changes anything in GoatCounter. Their API allows 4 requests a second, so calls run one after another.

type Row = { name: string; count: number };

export type VisitorStats = {
  /** Visitors per day, oldest first, for the last 30 days. */
  days: { day: string; count: number }[];
  today: number;
  week: number;
  month: number;
  pages: Row[];
  referrers: Row[];
  countries: Row[];
  devices: Row[];
};

function site() {
  const code = process.env.GOATCOUNTER_CODE ?? "";
  const token = process.env.GOATCOUNTER_API_TOKEN ?? "";
  return /^[a-z0-9-]+$/.test(code) && token ? { code, token } : null;
}

export function visitorStatsReady() {
  return site() !== null;
}

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** One API call. Calls are spaced out. A "too many requests" answer waits for the limit to reset and tries again;
 * a stray 404 or server error (seen now and then on stats/total) gets one more try. */
async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const s = site()!;
  const url = `https://${s.code}.goatcounter.com/api/v0/${path}?${new URLSearchParams(params)}`;
  for (let attempt = 0; ; attempt++) {
    await wait(300);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${s.token}`, "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 429 && attempt < 2) {
      const reset = Number(res.headers.get("X-Rate-Limit-Reset")) || 1;
      await wait(Math.min(reset, 3) * 1000);
      continue;
    }
    if ((res.status === 404 || res.status >= 500) && attempt === 0) {
      await wait(1000);
      continue;
    }
    if (!res.ok) throw new Error(`GoatCounter ${path}: ${res.status}`);
    return res.json() as Promise<T>;
  }
}

/** GoatCounter wants RFC 3339 times rounded to the hour. */
const hour = (d: Date) => `${d.toISOString().slice(0, 13)}:00:00Z`;

/** Last 30 days of visitors, plus top pages, referrers, countries and screen sizes. Null if not set up. */
export async function visitorStats(): Promise<VisitorStats | null> {
  if (!site()) return null;
  const end = new Date(Date.now() + 3_600_000);
  const start = new Date(`${new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)}T00:00:00Z`);
  const range = { start: hour(start), end: hour(end) };

  // The daily totals still fail sometimes after the retry; the lists below are worth showing anyway.
  const total = await get<{ total?: number; stats?: { day: string; daily: number }[] }>("stats/total", range).catch(
    (e) => {
      console.error("[stats]", e);
      return {} as { total?: number; stats?: { day: string; daily: number }[] };
    },
  );
  const hits = await get<{ hits?: { path: string; title?: string; count: number; event?: boolean }[] }>(
    "stats/hits",
    { ...range, limit: "10" },
  );
  // A side list that still fails shows as empty instead of hiding every number.
  const list = (page: string) =>
    get<{ stats?: { name: string; count: number }[] }>(`stats/${page}`, { ...range, limit: "8" }).then(
      (r) => (r.stats ?? []).map((x) => ({ name: x.name || "(unknown)", count: x.count })),
      (e) => {
        console.error("[stats]", e);
        return [];
      },
    );
  const referrers = await list("toprefs");
  const countries = await list("locations");
  const devices = await list("sizes");

  const days = (total.stats ?? []).map((d) => ({ day: d.day, count: d.daily }));
  const sum = (n: number) => days.slice(-n).reduce((a, d) => a + d.count, 0);
  return {
    days,
    today: days.at(-1)?.count ?? 0,
    week: sum(7),
    month: total.total ?? sum(30),
    pages: (hits.hits ?? [])
      .filter((h) => !h.event)
      .map((h) => ({ name: h.path, count: h.count })),
    referrers: referrers.map((r) => (r.name === "(unknown)" ? { ...r, name: "Direct / unknown" } : r)),
    countries,
    devices,
  };
}

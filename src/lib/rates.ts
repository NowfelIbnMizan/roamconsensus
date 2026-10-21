import { cacheLife } from "next/cache";
import { CURRENCIES, FALLBACK_RATES, type Rates } from "@/lib/currency";

/** Daily exchange rates per USD from open.er-api.com (free, no key), falling back to fixed rates. */
export async function getRates(): Promise<{ rates: Rates; live: boolean }> {
  "use cache";
  cacheLife("days");
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(5000) });
    const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (body.result !== "success" || !body.rates) throw new Error(body.result ?? `HTTP ${res.status}`);
    const rates = Object.fromEntries(
      CURRENCIES.map((c) => [c.code, body.rates![c.code] ?? FALLBACK_RATES[c.code]]),
    ) as Rates;
    return { rates, live: true };
  } catch (e) {
    console.log(`[rates] using fallback rates: ${e instanceof Error ? e.message : e}`);
    return { rates: FALLBACK_RATES, live: false };
  }
}

import { indexNowKey } from "@/lib/indexnow";

// Bing fetches this to confirm IndexNow pings really come from this site.
export function GET() {
  return new Response(indexNowKey(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

import { getSearchIndex } from "@/lib/data";

/** The site-wide search index, fetched by the home page search box when someone starts typing. */
export async function GET() {
  return Response.json(await getSearchIndex(), {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
  });
}

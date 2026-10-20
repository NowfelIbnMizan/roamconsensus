import type { NextRequest } from "next/server";
import { findPhoto, placeholderCategories, type PlaceholderCategory } from "@/lib/photos";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("query")?.trim();
  const category = (params.get("category")?.toUpperCase() ?? "DESTINATION") as PlaceholderCategory;
  const key = params.get("key")?.trim() || (query ? `query:${query.toLowerCase()}` : "");

  if (!query || query.length > 120) return Response.json({ error: "query is required (max 120 chars)" }, { status: 400 });
  if (!placeholderCategories.includes(category)) {
    return Response.json({ error: `category must be one of ${placeholderCategories.join(", ")}` }, { status: 400 });
  }
  if (key.length > 200) return Response.json({ error: "key too long" }, { status: 400 });

  const photo = await findPhoto({ key, query, category, postUrl: params.get("postUrl") ?? undefined });
  return Response.json(photo);
}

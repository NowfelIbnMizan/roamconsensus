import type { NextRequest } from "next/server";
import { getEmbed, providerFor } from "@/lib/oembed";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !providerFor(url)) {
    return Response.json({ error: "url must be an https YouTube, TikTok or Instagram post" }, { status: 400 });
  }
  const embed = await getEmbed(url);
  if (!embed) return Response.json({ error: "Embed unavailable" }, { status: 502 });
  return Response.json(embed);
}

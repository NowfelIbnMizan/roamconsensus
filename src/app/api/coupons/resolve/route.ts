import type { NextRequest } from "next/server";
import { resolveItemOffer } from "@/lib/data";

export async function GET(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get("itemId");
  if (!itemId) return Response.json({ error: "itemId is required" }, { status: 400 });

  const offer = await resolveItemOffer(itemId);
  if (!offer) return Response.json({ error: "No bookable link for this item" }, { status: 404 });
  return Response.json(offer);
}

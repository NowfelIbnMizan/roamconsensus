import { db } from "@/lib/db";
import type { PostKind } from "@/generated/prisma/enums";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const optional = (fd: FormData, key: string) => text(fd, key) || null;

export const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Post type and its route(s) from the form, checked: a take has one route, a side by side two different ones. */
export async function postKindFields(fd: FormData) {
  const kind = (text(fd, "kind") || "GENERAL") as PostKind;
  const itineraryId = kind === "TAKE" || kind === "COMPARE" ? optional(fd, "itineraryId") : null;
  const otherItineraryId = kind === "COMPARE" ? optional(fd, "otherItineraryId") : null;
  if (kind !== "GENERAL" && kind !== "TRIP" && !itineraryId) throw new Error("Pick a route for this post.");
  if (kind === "COMPARE" && (!otherItineraryId || otherItineraryId === itineraryId))
    throw new Error("Pick two different routes to compare.");
  const routes = await db.itinerary.findMany({
    where: { id: { in: [itineraryId, otherItineraryId].filter((r) => r !== null) } },
    select: { slug: true, destinationId: true },
  });
  return { kind, itineraryId, otherItineraryId, routes };
}

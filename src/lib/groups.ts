import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { currentUser } from "@/lib/auth";
import type { CartItem } from "@/lib/cart-store";
import { db } from "@/lib/db";

export const newInviteToken = () => randomBytes(12).toString("base64url");

export const MAX_GROUP_ITEMS = 300;

// Same checks as a synced cart: the fields the site reads back to find and refresh a line.
export const GroupItems = z
  .array(
    z
      .object({
        id: z.string().max(300),
        name: z.string().max(300),
        itinerary: z.object({ slug: z.string().max(200) }).passthrough(),
      })
      .passthrough(),
  )
  .max(MAX_GROUP_ITEMS);

/** A stop as a group trip keeps it: without the adder's own day plan or private note. */
export function groupItemJson(item: z.infer<typeof GroupItems>[number]) {
  const copy: Record<string, unknown> = { ...item };
  delete copy.day;
  delete copy.note;
  return copy as Prisma.InputJsonObject;
}

export const unauthorized = () => Response.json({ error: "Sign in first" }, { status: 401 });
export const notFound = () => Response.json({ error: "Group trip not found" }, { status: 404 });

/** The signed-in member and the group, or a ready error response when either is missing. */
export async function memberOf(groupId: string) {
  const user = await currentUser();
  if (!user) return { error: unauthorized() };
  const group = await db.groupTrip.findFirst({ where: { id: groupId, members: { some: { userId: user.id } } } });
  if (!group) return { error: notFound() };
  return { user, group };
}

/** Everything the group page shows, with stops ordered by votes. */
export async function groupView(groupId: string, userId: string) {
  const g = await db.groupTrip.findUniqueOrThrow({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } }, orderBy: { joinedAt: "asc" } },
      items: {
        include: { addedBy: { select: { id: true, name: true } }, votes: { select: { userId: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return {
    id: g.id,
    name: g.name,
    isOwner: g.ownerId === userId,
    inviteToken: g.inviteToken,
    members: g.members.map((m) => ({ ...m.user, isOwner: m.user.id === g.ownerId })),
    items: g.items
      .map((i) => ({
        id: i.itemId,
        item: i.item as unknown as CartItem,
        addedBy: i.addedBy.name,
        canRemove: i.addedBy.id === userId || g.ownerId === userId,
        votes: i.votes.length,
        voted: i.votes.some((v) => v.userId === userId),
      }))
      .sort((a, b) => b.votes - a.votes),
  };
}
export type GroupView = Awaited<ReturnType<typeof groupView>>;

import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GroupItems, groupItemJson, newInviteToken, unauthorized } from "@/lib/groups";

/** Group trips the traveller is in. */
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const groups = await db.groupTrip.findMany({
    where: { members: { some: { userId: user.id } } },
    include: { _count: { select: { members: true, items: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return Response.json(
    groups.map((g) => ({
      id: g.id,
      name: g.name,
      members: g._count.members,
      stops: g._count.items,
      isOwner: g.ownerId === user.id,
    })),
  );
}

const Body = z.object({ name: z.string().trim().min(1).max(80), items: GroupItems.default([]) });

/** Starts a group trip, optionally filled from the traveller's cart. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Give the group trip a name" }, { status: 400 });
  if ((await db.groupTrip.count({ where: { ownerId: user.id } })) >= 20)
    return Response.json({ error: "You can start up to 20 group trips. Delete one first." }, { status: 400 });
  const group = await db.groupTrip.create({
    data: {
      name: body.data.name,
      ownerId: user.id,
      inviteToken: newInviteToken(),
      members: { create: { userId: user.id } },
      items: {
        create: [...new Map(body.data.items.map((i) => [i.id, i])).values()].map((i) => ({
          itemId: i.id,
          item: groupItemJson(i),
          addedById: user.id,
        })),
      },
    },
  });
  return Response.json({ id: group.id });
}

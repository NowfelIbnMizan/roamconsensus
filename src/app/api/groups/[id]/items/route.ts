import { db } from "@/lib/db";
import { GroupItems, groupItemJson, MAX_GROUP_ITEMS, memberOf } from "@/lib/groups";

type Params = { params: Promise<{ id: string }> };

/** Adds stops; ones already in the trip are left as they are. */
export async function POST(request: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  const items = GroupItems.safeParse((await request.json().catch(() => ({}))).items);
  if (!items.success) return Response.json({ error: "Invalid stops" }, { status: 400 });
  const count = await db.groupItem.count({ where: { groupId: group.id } });
  const room = Math.max(0, MAX_GROUP_ITEMS - count);
  const { count: added } = await db.groupItem.createMany({
    data: items.data.slice(0, room).map((i) => ({
      groupId: group.id,
      itemId: i.id,
      item: groupItemJson(i),
      addedById: user.id,
    })),
    skipDuplicates: true,
  });
  await db.groupTrip.update({ where: { id: group.id }, data: { updatedAt: new Date() } });
  return Response.json({ added });
}

/** Whoever added a stop, or the organiser, can take it out. */
export async function DELETE(request: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  const itemId = new URL(request.url).searchParams.get("itemId") ?? "";
  const row = await db.groupItem.findUnique({ where: { groupId_itemId: { groupId: group.id, itemId } } });
  if (!row) return Response.json({ ok: true });
  if (row.addedById !== user.id && group.ownerId !== user.id)
    return Response.json({ error: "Only who added it, or the organiser, can remove it" }, { status: 403 });
  await db.groupItem.delete({ where: { id: row.id } });
  return Response.json({ ok: true });
}

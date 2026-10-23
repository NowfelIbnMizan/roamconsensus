import { db } from "@/lib/db";
import { memberOf } from "@/lib/groups";

type Params = { params: Promise<{ id: string }> };

/** Toggles the member's 👍 on a stop. */
export async function POST(request: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  const itemId = String((await request.json().catch(() => ({}))).itemId ?? "");
  const row = await db.groupItem.findUnique({ where: { groupId_itemId: { groupId: group.id, itemId } } });
  if (!row) return Response.json({ error: "Stop not found" }, { status: 404 });
  const key = { groupItemId_userId: { groupItemId: row.id, userId: user.id } };
  const existing = await db.groupVote.findUnique({ where: key });
  if (existing) await db.groupVote.delete({ where: key });
  else await db.groupVote.create({ data: { groupItemId: row.id, userId: user.id } });
  return Response.json({ voted: !existing });
}

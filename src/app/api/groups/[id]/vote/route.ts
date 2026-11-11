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
  // Remove-or-add in two steps that can't fail when a double tap sends the same vote twice at once.
  const vote = { groupItemId: row.id, userId: user.id };
  const { count: removed } = await db.groupVote.deleteMany({ where: vote });
  if (!removed) await db.groupVote.createMany({ data: [vote], skipDuplicates: true });
  return Response.json({ voted: !removed });
}

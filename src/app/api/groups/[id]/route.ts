import { db } from "@/lib/db";
import { groupView, memberOf } from "@/lib/groups";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  return Response.json(await groupView(group.id, user.id));
}

/** The owner deletes the trip for everyone; anyone else leaves it. */
export async function DELETE(_: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  if (group.ownerId === user.id) await db.groupTrip.delete({ where: { id: group.id } });
  else await db.groupMember.delete({ where: { groupId_userId: { groupId: group.id, userId: user.id } } });
  return Response.json({ ok: true });
}

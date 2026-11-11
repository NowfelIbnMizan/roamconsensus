import { z } from "zod";
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

/** Anyone in the trip can set the shared budget (US cents), or clear it with null. */
export async function PATCH(request: Request, { params }: Params) {
  const { group, error } = await memberOf((await params).id);
  if (error) return error;
  const budget = z.number().int().min(0).max(2_000_000_000).nullable().safeParse((await request.json().catch(() => ({}))).budgetCents);
  if (!budget.success) return Response.json({ error: "Invalid budget" }, { status: 400 });
  await db.groupTrip.update({ where: { id: group.id }, data: { budgetCents: budget.data } });
  return Response.json({ ok: true });
}

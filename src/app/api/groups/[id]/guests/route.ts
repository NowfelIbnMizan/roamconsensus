import { z } from "zod";
import { db } from "@/lib/db";
import { memberOf } from "@/lib/groups";

type Params = { params: Promise<{ id: string }> };

const MAX_GUESTS = 30;

/** Any member adds a friend by name, so costs can include people who never sign in. */
export async function POST(request: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  const name = z.string().trim().min(1).max(40).safeParse((await request.json().catch(() => ({}))).name);
  if (!name.success) return Response.json({ error: "Type a name (up to 40 letters)" }, { status: 400 });
  if ((await db.groupGuest.count({ where: { groupId: group.id } })) >= MAX_GUESTS)
    return Response.json({ error: "This trip has too many guests" }, { status: 400 });
  await db.groupGuest.create({ data: { groupId: group.id, name: name.data, createdById: user.id } });
  return Response.json({ ok: true });
}

/** Whoever added a guest, or the organiser, removes them while no cost names them. */
export async function DELETE(request: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  const guestId = new URL(request.url).searchParams.get("guestId") ?? "";
  const guest = await db.groupGuest.findFirst({ where: { id: guestId, groupId: group.id } });
  if (!guest) return Response.json({ ok: true });
  if (![guest.createdById, group.ownerId].includes(user.id))
    return Response.json({ error: "Only who added them or the organiser can remove a guest" }, { status: 403 });
  const used = await db.groupExpense.count({
    where: { groupId: group.id, OR: [{ paidById: guest.id }, { shares: { some: { userId: guest.id } } }] },
  });
  if (used) return Response.json({ error: "Delete their costs first" }, { status: 400 });
  await db.groupGuest.delete({ where: { id: guest.id } });
  return Response.json({ ok: true });
}

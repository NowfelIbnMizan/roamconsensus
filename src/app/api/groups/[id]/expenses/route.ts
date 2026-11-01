import { z } from "zod";
import { db } from "@/lib/db";
import { memberOf } from "@/lib/groups";

type Params = { params: Promise<{ id: string }> };

const MAX_GROUP_EXPENSES = 1000;

const Expense = z.object({
  title: z.string().trim().min(1).max(120),
  amountCents: z.number().int().positive().max(1e12),
  currency: z.string().regex(/^[A-Z]{3}$/),
  paidById: z.string().max(100),
  isSettlement: z.boolean().default(false),
  itemId: z.string().max(300).nullable().default(null),
  shares: z
    .array(z.object({ userId: z.string().max(100), amountCents: z.number().int().min(0).max(1e12) }))
    .min(1)
    .max(50),
});

/** Logs a cost (or a payback). Payer and everyone sharing it must be in the group, and the parts must add up. */
export async function POST(request: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  const parsed = Expense.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the amount and who it's split between" }, { status: 400 });
  const e = parsed.data;
  // Members and guests both count; a guest's id stands in for a user id.
  const [memberRows, guestRows] = await Promise.all([
    db.groupMember.findMany({ where: { groupId: group.id }, select: { userId: true } }),
    db.groupGuest.findMany({ where: { groupId: group.id }, select: { id: true } }),
  ]);
  const members = new Set([...memberRows.map((m) => m.userId), ...guestRows.map((g) => g.id)]);
  const shares = e.shares.filter((s) => s.amountCents > 0);
  if (!members.has(e.paidById) || shares.some((s) => !members.has(s.userId)) || new Set(shares.map((s) => s.userId)).size !== shares.length)
    return Response.json({ error: "Everyone in a cost must be in this group trip" }, { status: 400 });
  if (shares.reduce((sum, s) => sum + s.amountCents, 0) !== e.amountCents)
    return Response.json({ error: "The parts don't add up to the total" }, { status: 400 });
  if ((await db.groupExpense.count({ where: { groupId: group.id } })) >= MAX_GROUP_EXPENSES)
    return Response.json({ error: "This trip has too many costs logged" }, { status: 400 });
  await db.groupExpense.create({
    data: {
      groupId: group.id,
      title: e.title,
      amountCents: e.amountCents,
      currency: e.currency,
      paidById: e.paidById,
      createdById: user.id,
      isSettlement: e.isSettlement,
      itemId: e.itemId,
      shares: { create: shares },
    },
  });
  await db.groupTrip.update({ where: { id: group.id }, data: { updatedAt: new Date() } });
  return Response.json({ ok: true });
}

/** Whoever logged a cost, whoever paid it, or the organiser can delete it. */
export async function DELETE(request: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  const expenseId = new URL(request.url).searchParams.get("expenseId") ?? "";
  const row = await db.groupExpense.findFirst({ where: { id: expenseId, groupId: group.id } });
  if (!row) return Response.json({ ok: true });
  if (![row.createdById, row.paidById, group.ownerId].includes(user.id))
    return Response.json({ error: "Only who logged it, who paid, or the organiser can delete it" }, { status: 403 });
  await db.groupExpense.delete({ where: { id: row.id } });
  return Response.json({ ok: true });
}

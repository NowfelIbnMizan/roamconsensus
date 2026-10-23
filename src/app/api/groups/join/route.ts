import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/groups";

const MAX_MEMBERS = 30;

/** Joins the group trip an invite link points to. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const token = z
    .string()
    .min(8)
    .max(64)
    .safeParse((await request.json().catch(() => ({}))).token);
  if (!token.success) return Response.json({ error: "Invalid invite link" }, { status: 400 });
  const group = await db.groupTrip.findUnique({
    where: { inviteToken: token.data },
    include: { _count: { select: { members: true } } },
  });
  if (!group) return Response.json({ error: "This invite link has expired. Ask for a new one." }, { status: 404 });
  const already = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });
  if (!already) {
    if (group._count.members >= MAX_MEMBERS)
      return Response.json({ error: `This group trip is full (${MAX_MEMBERS} people).` }, { status: 400 });
    await db.groupMember.create({ data: { groupId: group.id, userId: user.id } });
  }
  return Response.json({ id: group.id });
}

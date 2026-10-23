import { db } from "@/lib/db";
import { memberOf, newInviteToken } from "@/lib/groups";

type Params = { params: Promise<{ id: string }> };

/** The organiser makes a new invite link; the old one stops working. People already in stay in. */
export async function POST(_: Request, { params }: Params) {
  const { user, group, error } = await memberOf((await params).id);
  if (error) return error;
  if (group.ownerId !== user.id) return Response.json({ error: "Only the organiser can do that" }, { status: 403 });
  const { inviteToken } = await db.groupTrip.update({
    where: { id: group.id },
    data: { inviteToken: newInviteToken() },
  });
  return Response.json({ inviteToken });
}

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/** The traveller's own trip, or null; another account's trip id reads as not found. */
async function ownTrip(id: string) {
  const user = await currentUser();
  if (!user) return { error: Response.json({ error: "Sign in first" }, { status: 401 }) };
  const trip = await db.savedTrip.findFirst({ where: { id, userId: user.id } });
  if (!trip) return { error: Response.json({ error: "Trip not found" }, { status: 404 }) };
  return { trip };
}

export async function GET(_: Request, { params }: Params) {
  const { trip, error } = await ownTrip((await params).id);
  return error ?? Response.json({ name: trip.name, data: trip.data });
}

export async function DELETE(_: Request, { params }: Params) {
  const { trip, error } = await ownTrip((await params).id);
  if (error) return error;
  await db.savedTrip.delete({ where: { id: trip.id } });
  return Response.json({ ok: true });
}

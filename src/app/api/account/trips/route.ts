import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { type CartData, describeTrip, readCartBody } from "@/lib/cart-data";
import { db } from "@/lib/db";

const MAX_TRIPS = 50;
const unauthorized = () => Response.json({ error: "Sign in first" }, { status: 401 });

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const trips = await db.savedTrip.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return Response.json(
    trips.map((t) => ({ id: t.id, name: t.name, updatedAt: t.updatedAt, ...describeTrip(t.data as CartData) })),
  );
}

const Name = z.string().trim().min(1).max(80);

/** Saves a copy of the cart under a name. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { data, body } = await readCartBody(request);
  const name = Name.safeParse(body.name);
  if (!name.success || !data) return Response.json({ error: "Give the trip a name" }, { status: 400 });
  if (!data.items.length) return Response.json({ error: "Your trip is empty" }, { status: 400 });
  if ((await db.savedTrip.count({ where: { userId: user.id } })) >= MAX_TRIPS)
    return Response.json({ error: `You can keep up to ${MAX_TRIPS} trips. Delete one first.` }, { status: 400 });
  const trip = await db.savedTrip.create({ data: { userId: user.id, name: name.data, data } });
  return Response.json({ id: trip.id });
}

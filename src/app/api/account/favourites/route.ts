import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const unauthorized = () => Response.json({ error: "Sign in first" }, { status: 401 });
const Key = z.object({ destination: z.string().max(200), place: z.string().max(200) });

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const rows = await db.favouritePlace.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { destination: true, destinationName: true, place: true, name: true, category: true, area: true },
  });
  return Response.json(rows);
}

/** Hearts a place. Name and city come from the database, not the request. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const key = Key.safeParse(await request.json().catch(() => null));
  if (!key.success) return Response.json({ error: "Invalid place" }, { status: 400 });
  const place = await db.place.findFirst({
    where: { slug: key.data.place, destination: { slug: key.data.destination } },
    include: { destination: { select: { name: true } } },
  });
  if (!place) return Response.json({ error: "Place not found" }, { status: 404 });
  const data = {
    destinationName: place.destination.name,
    name: place.name,
    category: place.category,
    area: place.area,
  };
  await db.favouritePlace.upsert({
    where: { userId_destination_place: { userId: user.id, ...key.data } },
    create: { userId: user.id, ...key.data, ...data },
    update: data,
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const key = Key.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!key.success) return Response.json({ error: "Invalid place" }, { status: 400 });
  await db.favouritePlace.deleteMany({ where: { userId: user.id, ...key.data } });
  return Response.json({ ok: true });
}

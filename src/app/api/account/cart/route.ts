import { currentUser } from "@/lib/auth";
import { readCartBody } from "@/lib/cart-data";
import { db } from "@/lib/db";

const unauthorized = () => Response.json({ error: "Sign in first" }, { status: 401 });

/** The signed-in traveller's synced cart, or null before their first sync. */
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const cart = await db.userCart.findUnique({ where: { userId: user.id } });
  return Response.json({ data: cart?.data ?? null, updatedAt: cart?.updatedAt ?? null });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { data } = await readCartBody(request);
  if (!data) return Response.json({ error: "Invalid cart" }, { status: 400 });
  await db.userCart.upsert({ where: { userId: user.id }, create: { userId: user.id, data }, update: { data } });
  return Response.json({ ok: true });
}

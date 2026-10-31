import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const unauthorized = () => Response.json({ error: "Sign in first" }, { status: 401 });

const Prefs = z.object({
  tier: z.enum(["", "BACKPACKER", "BUDGET", "MIDRANGE", "LUXURY"]),
  length: z.number().int().min(0).max(10),
  been: z.array(z.string().max(80)).max(200),
  passport: z.string().max(80),
  currency: z.string().max(8),
});

/** The signed-in traveller's travel profile, or null before they've saved one. */
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const row = await db.user.findUnique({ where: { id: user.id }, select: { prefs: true } });
  return Response.json({ prefs: row?.prefs ?? null });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const prefs = Prefs.safeParse(await request.json().catch(() => null));
  if (!prefs.success) return Response.json({ error: "Invalid" }, { status: 400 });
  await db.user.update({ where: { id: user.id }, data: { prefs: prefs.data } });
  return Response.json({ ok: true });
}

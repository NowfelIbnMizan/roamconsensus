import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { alertsOffToken } from "@/lib/alerts";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/email";

export async function GET(request: Request) {
  // The "Turn off alerts" link in alert emails: works without signing in, signed per account.
  const params = new URL(request.url).searchParams;
  if (params.has("off")) return turnOff(params.get("off"), params.get("t"));
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  const row = await db.user.findUnique({ where: { id: user.id }, select: { alertsEnabled: true } });
  return Response.json({ enabled: row?.alertsEnabled ?? false });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  const enabled = z.boolean().safeParse((await request.json().catch(() => ({}))).enabled);
  if (!enabled.success) return Response.json({ error: "Invalid" }, { status: 400 });
  await db.user.update({
    where: { id: user.id },
    // Turning alerts on starts from now, so routes added before don't all arrive at once.
    data: { alertsEnabled: enabled.data, ...(enabled.data ? { alertsCheckedAt: new Date() } : {}) },
  });
  if (enabled.data) await db.userCart.updateMany({ where: { userId: user.id }, data: { alertPrices: Prisma.DbNull } });
  return Response.json({ ok: true });
}

async function turnOff(userId: string | null, token: string | null) {
  const expected = userId ? Buffer.from(alertsOffToken(userId)) : null;
  const given = Buffer.from(token ?? "");
  if (!userId || !expected || expected.length !== given.length || !timingSafeEqual(expected, given))
    return Response.json({ error: "Invalid link" }, { status: 400 });
  await db.user.updateMany({ where: { id: userId }, data: { alertsEnabled: false } });
  return Response.redirect(`${siteUrl()}/my-trips?alerts=off`, 303);
}

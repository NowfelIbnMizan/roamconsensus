"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { canSendEmail, sendEmail, siteUrl, tripEmailHtml } from "@/lib/email";

export type SubscribeState = { ok: boolean; message: string } | null;

const Form = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  source: z.enum(["footer", "trip"]),
  tripPath: z.string().max(8000).optional(),
  // Bots fill every field; people never see this one.
  website: z.literal("").optional(),
});

/** Footer sign-up, or "email me this trip" from the cart. */
export async function subscribe(_: SubscribeState, fd: FormData): Promise<SubscribeState> {
  const parsed = Form.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "That email address doesn't look right." };
  const { email, source, tripPath } = parsed.data;
  // Only links to this site's own trip page are ever emailed.
  const tripUrl = tripPath?.startsWith("/trip?t=") ? `${siteUrl()}${tripPath}` : null;

  const existing = await db.subscriber.findUnique({ where: { email } });
  await db.subscriber.upsert({
    where: { email },
    create: { email, source, tripUrl },
    // Anyone can type any address here, so this form never undoes an unsubscribe. Someone who wants back in writes to us.
    update: { tripUrl: tripUrl ?? undefined },
  });

  if (source !== "trip" || !tripUrl) return { ok: true, message: "You're on the list. Thanks!" };
  if (!canSendEmail())
    return { ok: false, message: "Emailing trips isn't switched on yet. Use Share my trip instead." };
  // One trip email per address every 5 minutes, so the form can't be used to flood someone's inbox.
  if (existing?.lastEmailedAt && Date.now() - existing.lastEmailedAt.getTime() < 5 * 60_000)
    return { ok: false, message: "We just sent one. Check your inbox (and spam) in a minute." };

  // And at most 50 trip emails an hour site-wide, so the form can't be used to spam many addresses through us.
  const lastHour = await db.subscriber.count({ where: { lastEmailedAt: { gt: new Date(Date.now() - 60 * 60_000) } } });
  if (lastHour >= 50) return { ok: false, message: "Couldn't send the email right now. Try again in a bit." };

  const sent = await sendEmail({
    to: email,
    subject: "Your trip plan from Creatour",
    html: tripEmailHtml(tripUrl, email),
  });
  if (!sent) return { ok: false, message: "Couldn't send the email right now. Try again in a bit." };
  await db.subscriber.update({ where: { email }, data: { lastEmailedAt: new Date() } });
  return { ok: true, message: "Sent! Check your inbox." };
}

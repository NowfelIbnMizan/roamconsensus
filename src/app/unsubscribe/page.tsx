import type { Metadata } from "next";
import { connection } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { unsubscribeToken } from "@/lib/email";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

async function unsubscribe(email: string, token: string) {
  const expected = Buffer.from(unsubscribeToken(email));
  const given = Buffer.from(token);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  await db.subscriber.updateMany({ where: { email }, data: { unsubscribedAt: new Date() } });
  return true;
}

export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  await connection();
  const { e, t } = await searchParams;
  const done = typeof e === "string" && typeof t === "string" && (await unsubscribe(e.toLowerCase(), t));
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h1 className="text-2xl font-semibold">{done ? "You're unsubscribed" : "That link didn't work"}</h1>
      <p className="mt-2 text-muted">
        {done
          ? "We won't email you again. Sorry to see you go."
          : "The unsubscribe link looks incomplete. Open it straight from the email, or reply to the email and we'll remove you."}
      </p>
    </div>
  );
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const COOKIE = "rc_admin";

/** Cookie value derived from ADMIN_PASSWORD, so changing the password logs every browser out. */
function token() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("roamconsensus-admin").digest("hex");
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Google accounts that get into the admin with no password, from ADMIN_EMAILS (comma-separated) in Vercel. */
function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Signed in with the admin password, or with Google as one of ADMIN_EMAILS (Google has verified the address). */
export async function isAdmin() {
  const expected = token();
  const value = (await cookies()).get(COOKIE)?.value;
  if (expected && value && same(value, expected)) return true;
  const emails = adminEmails();
  if (emails.length === 0) return false;
  const user = await currentUser().catch(() => null);
  return Boolean(user?.emailVerified && emails.includes(user.email.toLowerCase()));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

const TRIES = 10;
const WINDOW_MS = 15 * 60_000;

/**
 * Counts this try and returns how many there have been in the last 15 minutes. One database statement, so a burst of
 * guesses sent at the same moment can't all read "0 so far" and slip past the limit. Kept in the database so every
 * server instance sees the same count.
 */
async function countTry() {
  const now = Date.now();
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "SiteSetting" ("key", "value")
    VALUES ('adminLoginTries', jsonb_build_object('count', 1, 'since', ${now}::bigint))
    ON CONFLICT ("key") DO UPDATE SET "value" = CASE
      WHEN COALESCE(("SiteSetting"."value"->>'since')::bigint, 0) < ${now - WINDOW_MS}::bigint
        THEN jsonb_build_object('count', 1, 'since', ${now}::bigint)
      ELSE jsonb_build_object(
        'count', COALESCE(("SiteSetting"."value"->>'count')::int, 0) + 1,
        'since', ("SiteSetting"."value"->>'since')::bigint)
    END
    RETURNING ("value"->>'count')::int AS count`;
  return rows[0]?.count ?? TRIES + 1;
}

/**
 * "ok" sets the cookie; "wrong" and "locked" don't. After 10 tries in 15 minutes the password box locks for everyone
 * until the window ends; Google sign-in for ADMIN_EMAILS still works. Right passwords count as tries too, which only
 * matters to someone logging in ten times in a row.
 */
export async function logIn(password: string): Promise<"ok" | "wrong" | "locked"> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return "wrong";
  if ((await countTry()) > TRIES) return "locked";
  if (!same(password, expected)) return "wrong";
  (await cookies()).set(COOKIE, token()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return "ok";
}

/** Ends the password cookie and the Google session too, or a Google admin would land straight back in. */
export async function logOut() {
  (await cookies()).delete(COOKIE);
  await auth.api.signOut({ headers: await headers() }).catch(() => {});
}

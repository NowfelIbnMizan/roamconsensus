import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@/lib/auth";

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

/** True and sets the cookie when the password matches. */
export async function logIn(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !same(password, expected)) return false;
  (await cookies()).set(COOKIE, token()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

/** Ends the password cookie and the Google session too, or a Google admin would land straight back in. */
export async function logOut() {
  (await cookies()).delete(COOKIE);
  await auth.api.signOut({ headers: await headers() }).catch(() => {});
}

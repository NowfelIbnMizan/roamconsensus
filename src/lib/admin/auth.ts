import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

export async function isAdmin() {
  const expected = token();
  const value = (await cookies()).get(COOKIE)?.value;
  return Boolean(expected && value && same(value, expected));
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

export async function logOut() {
  (await cookies()).delete(COOKIE);
}

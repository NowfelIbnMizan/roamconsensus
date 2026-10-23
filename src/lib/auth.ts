import { createHash } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/email";

/** Google sign-in shows only once both Google keys are set (Vercel > Settings > Environment Variables). */
export const googleLoginEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Signs session cookies. Falls back to one derived from the admin password so sign-in works without another variable;
// changing either signs everyone out.
const secret =
  process.env.BETTER_AUTH_SECRET ??
  createHash("sha256")
    .update(`roamconsensus-auth:${process.env.ADMIN_PASSWORD ?? "dev"}`)
    .digest("hex");

const baseURL = process.env.BETTER_AUTH_URL ?? siteUrl();

export const auth = betterAuth({
  appName: "Creatour",
  baseURL,
  secret,
  // Signing in on www.creatour.co (which redirects) or a Vercel preview URL still lands back on the right site.
  trustedOrigins: [baseURL, "https://creatour.co", "https://www.creatour.co"],
  database: prismaAdapter(db, { provider: "postgresql" }),
  socialProviders: googleLoginEnabled()
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : {},
  user: { deleteUser: { enabled: true } },
  session: {
    expiresIn: 60 * 60 * 24 * 90, // stay signed in for 90 days
    // Saves a database read on most requests; a sign-out elsewhere takes up to 5 minutes to reach this device.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  telemetry: { enabled: false },
  plugins: [nextCookies()],
});

/** The signed-in traveller, or null. Reads cookies, so only call it at request time. */
export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

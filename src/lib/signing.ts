import { createHmac } from "node:crypto";

/**
 * Signs links that work without signing in (unsubscribe, turn off alerts). Uses BETTER_AUTH_SECRET, a long random
 * value, when set: anyone can get one of these links sent to themselves, so a key made from a human password could be
 * guessed offline from it.
 */
export function signLink(text: string) {
  const key = process.env.BETTER_AUTH_SECRET ?? process.env.ADMIN_PASSWORD ?? "roamconsensus";
  return createHmac("sha256", key).update(text).digest("hex");
}

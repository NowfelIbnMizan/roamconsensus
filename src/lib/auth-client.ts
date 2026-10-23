"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

/** Opens Google's account picker, then comes back to the page the traveller was on. */
export function signInWithGoogle(callbackURL = window.location.pathname + window.location.search) {
  return authClient.signIn.social({ provider: "google", callbackURL });
}

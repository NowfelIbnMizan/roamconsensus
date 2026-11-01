"use client";

import { signInWithGoogle } from "@/lib/auth-client";

export function SignInButton() {
  return (
    <button
      type="button"
      onClick={() => signInWithGoogle()}
      className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
    >
      Continue with Google
    </button>
  );
}

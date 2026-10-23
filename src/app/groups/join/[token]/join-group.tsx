"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { authClient, signInWithGoogle } from "@/lib/auth-client";

/** Invite link landing: sign in with Google if needed, then join and open the group trip. */
export function JoinGroup() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending || !session) return;
    let stale = false;
    fetch("/api/groups/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => ({ ok: res.ok, body: await res.json().catch(() => ({})) }))
      .catch(() => ({ ok: false, body: {} as { error?: string; id?: string } }))
      .then(({ ok, body }) => {
        if (stale) return;
        if (ok && body.id) router.replace(`/groups/${body.id}`);
        else setError(body.error ?? "Couldn't join. Try the link again.");
      });
    return () => {
      stale = true;
    };
  }, [isPending, session, token, router]);

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-line bg-card p-6 text-center">
      <Users className="mx-auto size-8 text-accent" aria-hidden />
      <h1 className="mt-3 font-display text-2xl font-semibold">You&apos;re invited to plan a trip</h1>
      {error ? (
        <p role="alert" className="mt-3 text-muted">
          {error}
        </p>
      ) : isPending || session ? (
        <p className="mt-3 text-muted">Joining…</p>
      ) : (
        <>
          <p className="mt-3 text-muted">Sign in to add stops, vote on them and copy the trip to your own cart.</p>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
          >
            Continue with Google
          </button>
        </>
      )}
    </section>
  );
}

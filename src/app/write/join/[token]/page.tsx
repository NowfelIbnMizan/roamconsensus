import { PenLine } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { acceptInvite } from "@/lib/writer/actions";
import { SignInButton } from "../../sign-in";

export default async function JoinAsWriter({ params }: PageProps<"/write/join/[token]">) {
  const { token } = await params;
  const [invite, user] = await Promise.all([
    db.writerInvite.findUnique({ where: { token }, select: { usedAt: true } }),
    currentUser().catch(() => null),
  ]);
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-line bg-card p-6 text-center">
      <PenLine className="mx-auto size-8 text-accent" aria-hidden />
      <h1 className="mt-3 font-display text-2xl font-semibold">You&apos;re invited to write for Creatour</h1>
      {!invite || invite.usedAt ? (
        <p className="mt-3 text-muted">This invite link has already been used or was cancelled. Ask for a new one.</p>
      ) : !user ? (
        <>
          <p className="mt-3 text-muted">
            Share your own trips on the Creatour blog. Sign in with Google to accept; posts go live after review.
          </p>
          <SignInButton />
        </>
      ) : (
        <form action={acceptInvite}>
          <input type="hidden" name="token" value={token} />
          <p className="mt-3 text-muted">
            Your posts will show as by <span className="font-medium text-foreground">{user.name}</span>.
          </p>
          <button
            type="submit"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
          >
            Accept and start writing
          </button>
        </form>
      )}
    </section>
  );
}

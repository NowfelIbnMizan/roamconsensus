import Link from "next/link";
import { PenLine } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentWriter } from "@/lib/writer/auth";
import { SignInButton } from "./sign-in";

const status = (p: { published: boolean; publishedAt: Date | null; submittedAt: Date | null; reviewNote: string | null }) =>
  p.published
    ? { label: "Live", tone: "bg-accent-soft text-accent" }
    : p.publishedAt
      ? { label: "Taken down", tone: "bg-line text-muted" }
      : p.submittedAt
        ? { label: "Waiting for review", tone: "bg-amber-500/15 text-amber-800 dark:text-amber-300" }
        : p.reviewNote
          ? { label: "Sent back", tone: "bg-rose-500/15 text-rose-800 dark:text-rose-300" }
          : { label: "Draft", tone: "bg-line text-muted" };

export default async function WriteHome({ searchParams }: PageProps<"/write">) {
  const writer = await currentWriter();
  if (!writer) {
    const user = await currentUser().catch(() => null);
    return (
      <section className="mx-auto max-w-md rounded-2xl border border-line bg-card p-6 text-center">
        <PenLine className="mx-auto size-8 text-accent" aria-hidden />
        <h1 className="mt-3 font-display text-2xl font-semibold">Write for Creatour</h1>
        {user ? (
          <p className="mt-3 text-muted">
            Writing is by invitation. Open the invite link you were sent while signed in as this Google account.
          </p>
        ) : (
          <>
            <p className="mt-3 text-muted">Guest writers sign in here.</p>
            <SignInButton />
          </>
        )}
      </section>
    );
  }
  const [posts, { sent }] = await Promise.all([
    db.post.findMany({
      where: { authorId: writer.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, published: true, publishedAt: true, submittedAt: true, reviewNote: true },
    }),
    searchParams,
  ]);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">My posts</h1>
        <Link
          href="/write/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          <PenLine className="size-4" aria-hidden /> New post
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Hi {writer.name.split(" ")[0]}. Save drafts as you go, then send a post for review. It goes live once it&apos;s
        approved.
      </p>
      {sent && (
        <p role="status" className="mt-4 rounded-2xl border border-accent bg-card p-4 text-sm">
          Sent for review. Thanks! You&apos;ll see it marked Live here once it&apos;s approved.
        </p>
      )}
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {posts.map((p) => {
          const s = status(p);
          return (
            <li key={p.id}>
              <Link href={`/write/${p.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-line/40">
                <span className="font-medium">{p.title}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${s.tone}`}>{s.label}</span>
              </Link>
            </li>
          );
        })}
        {posts.length === 0 && <li className="p-4 text-sm text-muted">No posts yet. Start with New post.</li>}
      </ul>
    </>
  );
}

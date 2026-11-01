import Link from "next/link";
import { db } from "@/lib/db";
import { savePost } from "@/lib/admin/actions";
import { SaveButton } from "../../ui";
import { PostFields, routeOptions } from "./post-fields";
import { EditDialog } from "../../edit-dialog";

export default async function BlogAdmin() {
  const [posts, cities, routes] = await Promise.all([
    db.post.findMany({
      // A guest's unsent draft (or one sent back) is theirs until they send it for review.
      where: { OR: [{ authorId: null, authorName: null }, { published: true }, { submittedAt: { not: null } }] },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, published: true, slug: true, submittedAt: true, authorName: true },
    }),
    db.destination.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    routeOptions(),
  ]);
  const waiting = posts.filter((p) => p.submittedAt && !p.published);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Blog</h1>
        <EditDialog title="Write a new post" add label="New post">
          <form action={savePost} className="grid gap-3 sm:grid-cols-2">
            <PostFields
              cities={cities.map((c) => ({ value: c.id, label: c.name }))}
              routes={routes}
            />
            <div className="sm:col-span-2">
              <SaveButton>Save post</SaveButton>
            </div>
          </form>
        </EditDialog>
      </div>
      <p className="mt-1 text-sm text-muted">
        Posts show at /blog once published. Drafts stay hidden. Guest writers&apos; posts arrive here when they send
        them for review; invite writers in <Link href="/admin/writers" className="underline">Writers</Link>.
      </p>
      {waiting.length > 0 && (
        <section className="mt-6 rounded-2xl border border-accent bg-card p-4">
          <h2 className="font-semibold">Waiting for your review · {waiting.length}</h2>
          <ul className="mt-2 divide-y divide-line">
            {waiting.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/blog/${p.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-accent">
                  <span className="font-medium">{p.title}</span>
                  <span className="shrink-0 text-xs text-muted">by {p.authorName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {posts.filter((p) => !p.submittedAt || p.published).map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/blog/${p.id}`}
              className="flex items-center justify-between p-4 hover:bg-line/40"
            >
              <span className="font-medium">
                {p.title}
                {p.authorName && <span className="ml-2 text-xs font-normal text-muted">by {p.authorName}</span>}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${p.published ? "bg-accent-soft text-accent" : "bg-line text-muted"}`}
              >
                {p.published ? "Published" : "Draft"}
              </span>
            </Link>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="p-4 text-sm text-muted">No posts yet.</li>
        )}
      </ul>

    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { approvePost, deletePost, rejectPost, savePost } from "@/lib/admin/actions";
import { DeleteButton, SaveButton, inputClass } from "../../../ui";
import { PostFields, routeOptions } from "../post-fields";
import { requireAdmin } from "@/lib/admin/auth";

export default async function EditPost({
  params,
}: PageProps<"/admin/blog/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [post, cities, routes] = await Promise.all([
    db.post.findUnique({ where: { id } }),
    db.destination.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    routeOptions(),
  ]);
  if (!post) notFound();
  const waiting = Boolean(post.submittedAt && !post.published);
  return (
    <>
      <Link
        href="/admin/blog"
        className="text-sm text-muted hover:text-foreground"
      >
        ← All posts
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{post.title}</h1>
        {post.published && (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="text-sm font-medium text-accent underline"
          >
            View on site
          </Link>
        )}
      </div>
      {post.authorName && (
        <div className={`mt-4 rounded-2xl border p-4 text-sm ${waiting ? "border-accent bg-accent-soft" : "border-line bg-card"}`}>
          <p>
            <span className="font-semibold">Guest post by {post.authorName}.</span>{" "}
            {waiting
              ? `Sent for review ${post.submittedAt!.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}. Edit anything below, then approve, or send it back with a note.`
              : post.published
                ? "Live. The writer can no longer change it; your edits save as usual."
                : post.reviewNote
                  ? `Sent back: "${post.reviewNote}"`
                  : "The writer is still working on it."}
          </p>
          {waiting && (
            <form action={rejectPost} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={post.id} />
              <label className="block min-w-0 flex-1 basis-60">
                <span className="text-muted">Note for the writer (if you send it back)</span>
                <input name="note" className={`mt-1 ${inputClass}`} placeholder="e.g. Add what it cost and one photo" />
              </label>
              <button type="submit" className="rounded-full border border-line px-4 py-1.5 font-medium hover:border-accent">
                Send back
              </button>
            </form>
          )}
        </div>
      )}
      <form action={savePost} className="mt-6 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={post.id} />
        <PostFields
          p={post}
          cities={cities.map((c) => ({ value: c.id, label: c.name }))}
          routes={routes}
        />
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <SaveButton />
          {waiting && (
            <button
              type="submit"
              formAction={approvePost}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
            >
              Approve and publish
            </button>
          )}
        </div>
      </form>
      <div className="mt-4 text-right">
        <DeleteButton
          action={deletePost}
          id={post.id}
          what={`"${post.title}"`}
        />
      </div>
    </>
  );
}

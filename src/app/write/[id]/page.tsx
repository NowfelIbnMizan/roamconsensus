import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentWriter } from "@/lib/writer/auth";
import { deleteDraft, withdrawPost } from "@/lib/writer/actions";
import { CONTACT_EMAIL } from "@/lib/contact";
import { DeleteButton } from "@/app/admin/ui";
import { WriterPostForm } from "../post-form";

export default async function EditWriterPost({ params }: PageProps<"/write/[id]">) {
  const writer = await currentWriter();
  if (!writer) redirect("/write");
  const post = await db.post.findFirst({ where: { id: (await params).id, authorId: writer.id } });
  if (!post) notFound();
  const back = (
    <Link href="/write" className="text-sm text-muted hover:text-foreground">
      ← My posts
    </Link>
  );
  if (post.publishedAt)
    return (
      <>
        {back}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{post.title}</h1>
        <p className="mt-3 text-muted">
          This post has been published, so it can&apos;t be changed here. Need a fix? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        {post.published && (
          <Link href={`/blog/${post.slug}`} className="mt-4 inline-block font-medium text-accent underline">
            See it on the blog
          </Link>
        )}
      </>
    );
  return (
    <>
      {back}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{post.title}</h1>
      {post.submittedAt ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 text-sm">
          <p>Waiting for review. You can still make changes; they go into the same review.</p>
          <form action={withdrawPost}>
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="font-medium text-accent underline">
              Take it back
            </button>
          </form>
        </div>
      ) : (
        post.reviewNote && (
          <p className="mt-4 rounded-2xl border border-accent bg-card p-4 text-sm">
            <span className="font-semibold">Sent back with a note:</span> {post.reviewNote}
          </p>
        )
      )}
      <WriterPostForm p={post} />
      <div className="mt-6 flex justify-end">
        <DeleteButton action={deleteDraft} id={post.id} what="this post" verb="Delete this post" />
      </div>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deletePost, savePost } from "@/lib/admin/actions";
import { DeleteButton, SaveButton } from "../../../ui";
import { PostFields, routeOptions } from "../post-fields";

export default async function EditPost({
  params,
}: PageProps<"/admin/blog/[id]">) {
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
      <form action={savePost} className="mt-6 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={post.id} />
        <PostFields
          p={post}
          cities={cities.map((c) => ({ value: c.id, label: c.name }))}
          routes={routes}
        />
        <div>
          <SaveButton />
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

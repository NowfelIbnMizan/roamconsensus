import Link from "next/link";
import { db } from "@/lib/db";
import { savePost } from "@/lib/admin/actions";
import { SaveButton } from "../../ui";
import { PostFields, routeOptions } from "./post-fields";
import { EditDialog } from "../../edit-dialog";

export default async function BlogAdmin() {
  const [posts, cities, routes] = await Promise.all([
    db.post.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, published: true, slug: true },
    }),
    db.destination.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    routeOptions(),
  ]);
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
        Posts show at /blog once published. Drafts stay hidden.
      </p>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {posts.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/blog/${p.id}`}
              className="flex items-center justify-between p-4 hover:bg-line/40"
            >
              <span className="font-medium">{p.title}</span>
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

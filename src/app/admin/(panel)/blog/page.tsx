import Link from "next/link";
import { db } from "@/lib/db";
import { savePost } from "@/lib/admin/actions";
import { SaveButton } from "../../ui";
import { PostFields } from "./post-fields";

export default async function BlogAdmin() {
  const [posts, cities] = await Promise.all([
    db.post.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, published: true, slug: true },
    }),
    db.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <h1 className="text-2xl font-semibold">Blog</h1>
      <p className="mt-1 text-sm text-muted">Posts show at /blog once published. Drafts stay hidden.</p>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/blog/${p.id}`} className="flex items-center justify-between p-4 hover:bg-line/40">
              <span className="font-medium">{p.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${p.published ? "bg-accent-soft text-accent" : "bg-line text-muted"}`}
              >
                {p.published ? "Published" : "Draft"}
              </span>
            </Link>
          </li>
        ))}
        {posts.length === 0 && <li className="p-4 text-sm text-muted">No posts yet.</li>}
      </ul>

      <details className="mt-6 rounded-2xl border border-line bg-card p-4" open={posts.length === 0}>
        <summary className="cursor-pointer font-medium">Write a new post</summary>
        <form action={savePost} className="mt-4 grid gap-3 sm:grid-cols-2">
          <PostFields cities={cities.map((c) => ({ value: c.id, label: c.name }))} />
          <div>
            <SaveButton>Save post</SaveButton>
          </div>
        </form>
      </details>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Luggage } from "lucide-react";
import { getPosts } from "@/lib/data";
import { PostCover, formatDate } from "@/components/post-cover";

export const metadata: Metadata = {
  title: "Travel blog",
  description: "Trip ideas, guides and what travel creators agree on, from Creatour.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Travel blog</h1>
      <p className="mt-2 text-muted">Trip ideas and guides, built on what real travel creators recommend.</p>
      {posts.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          <Luggage className="mx-auto mb-3 size-10 text-muted" strokeWidth={1.25} aria-hidden />
          First posts coming soon.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="group block overflow-hidden rounded-2xl border border-line bg-card transition hover:border-accent"
              >
                <PostCover post={p} sizes="(min-width: 640px) 50vw, 100vw" credit={false} />
                <div className="p-5">
                  <p className="text-xs text-muted">
                    {formatDate(p.publishedAt)}
                    {p.destination && ` · ${p.destination.name}`}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold group-hover:text-accent">{p.title}</h2>
                  {p.excerpt && <p className="mt-1 line-clamp-3 text-sm text-muted">{p.excerpt}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

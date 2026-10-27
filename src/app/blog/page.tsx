import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getDestinations, getPosts } from "@/lib/data";
import { PostCover, formatDate } from "@/components/post-cover";

export const metadata: Metadata = {
  title: "Travel blog",
  description: "Short reads to plan smarter, built on the places travel creators don't miss. No sponsored lists.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [posts, destinations] = await Promise.all([getPosts(), getDestinations()]);
  const cities = destinations.filter((d) => !d.isSample && d._count.itineraries > 0);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-1 text-muted">Short reads to plan smarter. No fluff, no sponsored lists.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {posts.length === 0 ? (
          <div className="self-start rounded-2xl border border-dashed border-line-strong p-8 text-center">
            <BookOpen className="mx-auto size-8 text-muted" strokeWidth={1.5} aria-hidden />
            <p className="mt-3 font-semibold">First posts coming soon</p>
            <p className="mt-1 text-sm text-muted">The city guides and creator routes are already live. Start there.</p>
          </div>
        ) : (
          <ul className="self-start divide-y divide-line border-y border-line">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex items-start gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">
                      {formatDate(p.publishedAt)}
                      {p.destination && ` · ${p.destination.name}`}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold group-hover:text-accent">{p.title}</h2>
                    {p.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>}
                  </div>
                  <PostCover
                    post={p}
                    sizes="128px"
                    credit={false}
                    className="aspect-square w-24 shrink-0 overflow-hidden rounded-xl sm:w-32"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Planner-first: every visit can turn into a trip, posts or not. */}
        <aside className="self-start rounded-2xl border border-line bg-card p-5 lg:sticky lg:top-6">
          <p className="eyebrow">Ready to plan?</p>
          <ul className="mt-3 space-y-2">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/destinations/${c.slug}`}
                  className="flex items-center justify-between gap-3 text-sm hover:text-accent"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted">
                    {c._count.itineraries} {c._count.itineraries === 1 ? "route" : "routes"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/quiz" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            Not sure where? Find your match <ArrowRight className="size-4" aria-hidden />
          </Link>
        </aside>
      </div>
    </>
  );
}

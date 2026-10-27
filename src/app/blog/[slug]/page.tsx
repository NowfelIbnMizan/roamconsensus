import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { PostCover, formatDate } from "@/components/post-cover";
import { UpdatedOn } from "@/components/updated-on";
import { getEditor } from "@/lib/editor";
import { siteUrl } from "@/lib/email";
import { getPost, getPosts } from "@/lib/data";

type Props = PageProps<"/blog/[slug]">;

export async function generateStaticParams() {
  const posts = await getPosts();
  // Cache Components needs at least one path at build time; the placeholder just 404s.
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "coming-soon" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", publishedTime: post.publishedAt, modifiedTime: post.updatedAt },
  };
}

export default async function PostPage({ params }: Props) {
  const [post, editor] = await Promise.all([getPost((await params).slug), getEditor()]);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: editor.name, url: `${siteUrl()}/about` },
    mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`,
    ...(post.coverUrl ? { image: post.coverUrl } : {}),
  };

  return (
    <article className="mx-auto max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Link href="/blog" className="text-sm text-muted hover:text-foreground">
        ← Blog
      </Link>
      {post.destination && <p className="eyebrow mt-4">{post.destination.name}</p>}
      <h1 className={`${post.destination ? "mt-1" : "mt-3"} text-3xl font-semibold tracking-tight sm:text-4xl`}>
        {post.title}
      </h1>
      <p className="mt-2 text-sm text-muted">
        By{" "}
        <Link href="/about" className="underline">
          {editor.name}
        </Link>{" "}
        · {formatDate(post.publishedAt)}
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl">
        <PostCover post={post} sizes="(min-width: 672px) 672px, 100vw" />
      </div>
      <div className="mt-8">
        <Markdown source={post.body} />
      </div>
      {post.destination && (
        <Link
          href={`/destinations/${post.destination.slug}`}
          className="mt-10 flex items-center justify-between rounded-2xl border border-line bg-card p-5 hover:border-accent"
        >
          <span>
            <span className="block text-sm text-muted">Planning a trip?</span>
            <span className="font-semibold">Compare {post.destination.name} routes from real creators</span>
          </span>
          <ArrowRight className="size-5 text-accent" aria-hidden />
        </Link>
      )}
      <UpdatedOn date={post.updatedAt} />
    </article>
  );
}

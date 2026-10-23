import { getPost, getPosts } from "@/lib/data";
import { ogCard, ogSize } from "@/lib/og";

export const alt = "RoamConsensus blog post";
export const size = ogSize;
export const contentType = "image/png";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "coming-soon" }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  return ogCard({
    eyebrow: post?.destination ? `Blog · ${post.destination.name}` : "Blog",
    title: post?.title ?? "RoamConsensus blog",
    detail: post?.excerpt ?? undefined,
  });
}

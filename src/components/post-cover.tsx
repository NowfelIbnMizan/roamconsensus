import { Photo } from "@/components/photo";

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(iso),
  );

/** The post's own cover image, else its city's photo. */
export function PostCover({
  post,
  sizes,
  className = "aspect-[16/9]",
}: {
  post: { title: string; coverUrl: string | null; destination: { slug: string; name: string } | null };
  sizes: string;
  className?: string;
}) {
  if (post.coverUrl)
    // eslint-disable-next-line @next/next/no-img-element -- covers are pasted links from any site
    return <img src={post.coverUrl} alt="" loading="lazy" className={`w-full object-cover ${className}`} />;
  if (!post.destination) return <div className={`bg-accent-soft ${className}`} />;
  return (
    <Photo
      photoKey={`destination:${post.destination.slug}`}
      query={post.destination.name}
      category="DESTINATION"
      alt=""
      sizes={sizes}
      className={className}
    />
  );
}

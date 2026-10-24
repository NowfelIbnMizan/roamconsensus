import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CreatorAvatar } from "@/components/creator-avatar";
import { CreatorHover } from "@/components/creator-hover";
import { SocialIcon } from "@/components/social-icons";
import { creatorTint, SOCIALS, type CreatorLinks } from "@/lib/creator-links";

type Creator = {
  handle: string;
  name: string;
  profileUrl?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
} & CreatorLinks;

const pill = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset";

/**
 * A creator's name as a coloured pill. It links to their Creatour page, and a mouse resting on it opens a small profile
 * card. With `link` false (inside another link) it is a plain pill.
 */
export function CreatorChip({ creator, link = true }: { creator: Creator; link?: boolean }) {
  const content = (
    <>
      {creator.avatarUrl ? (
        <span aria-hidden className="relative size-4 shrink-0 overflow-hidden rounded-full">
          <Image src={creator.avatarUrl} alt="" fill sizes="16px" unoptimized className="object-cover" />
        </span>
      ) : (
        <span
          aria-hidden
          className="flex size-4 items-center justify-center rounded-full bg-current/15 text-[10px] font-bold"
        >
          {creator.name.charAt(0)}
        </span>
      )}
      {creator.name}
    </>
  );
  const className = `${pill} ${creatorTint(creator.handle)}`;
  if (!link) return <span className={className}>{content}</span>;
  return (
    <CreatorHover card={<CreatorCard creator={creator} />}>
      <Link href={`/creators/${creator.handle}`} className={`${className} hover:opacity-80`}>
        {content}
      </Link>
    </CreatorHover>
  );
}

/** The hover profile: face, bio, socials and a way to all their trips. */
function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <CreatorAvatar creator={creator} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{creator.name}</p>
          <p className="truncate text-xs text-muted">@{creator.handle}</p>
        </div>
      </div>
      {creator.bio && <p className="mt-3 line-clamp-4 text-sm text-muted">{creator.bio}</p>}
      <CreatorSocials creator={creator} className="mt-3" />
      <Link
        href={`/creators/${creator.handle}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
      >
        See their trips <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </>
  );
}

/** One round icon button per profile the creator has; their main link counts as a website when nothing else does. */
export function CreatorSocials({ creator, className = "" }: { creator: Creator; className?: string }) {
  const links: { key: (typeof SOCIALS)[number]["key"]; label: string; tint: string; url: string }[] = SOCIALS.filter(
    (s) => creator[s.key],
  ).map((s) => ({ ...s, url: creator[s.key]! }));
  if (creator.profileUrl && !links.some((l) => l.url === creator.profileUrl) && !creator.websiteUrl) {
    const site = SOCIALS.find((s) => s.key === "websiteUrl")!;
    links.push({ ...site, url: creator.profileUrl });
  }
  if (links.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label={`${creator.name} online`}>
      {links.map((s) => (
        <li key={s.key}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${creator.name} on ${s.label}`}
            title={s.label}
            className={`flex size-9 items-center justify-center rounded-full transition-opacity hover:opacity-80 ${s.tint}`}
          >
            <SocialIcon social={s.key} />
          </a>
        </li>
      ))}
    </ul>
  );
}

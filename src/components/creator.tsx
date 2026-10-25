import Image from "next/image";
import Link from "next/link";
import { ReadMore } from "@/components/read-more";
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

const pill =
  "inline-flex items-center gap-1.5 rounded-full bg-card py-0.5 pr-2.5 pl-1 text-sm font-medium text-foreground ring-1 ring-line-strong ring-inset";

/**
 * A creator's name as a quiet pill; only the initial carries the creator's colour. It links to their Creatour page; a mouse resting on it, or a tap on a phone,
 * opens a small profile card. With `link` false (inside another link) it is a plain pill.
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
          className={`flex size-4 items-center justify-center rounded-full text-[10px] font-bold ring-0 ${creatorTint(creator.handle)}`}
        >
          {creator.name.charAt(0)}
        </span>
      )}
      {creator.name}
    </>
  );
  const className = pill;
  if (!link) return <span className={className}>{content}</span>;
  return (
    <CreatorHover card={<CreatorCard creator={creator} />} label={`About ${creator.name}`}>
      <Link href={`/creators/${creator.handle}`} className={`${className} hover:ring-accent`}>
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
      {creator.bio && <ReadMore text={creator.bio} lines={4} className="mt-3" />}
      <CreatorSocials creator={creator} className="mt-3" />
      <p className="mt-3 text-xs text-muted">Independent creator. Not affiliated with Creatour and not an endorsement.</p>
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
            className={`flex size-9 items-center justify-center rounded-full ring-current/30 ring-inset hover:ring-2 ${s.tint}`}
          >
            <SocialIcon social={s.key} />
          </a>
        </li>
      ))}
    </ul>
  );
}

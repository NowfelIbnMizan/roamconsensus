import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { creatorTint, SOCIALS, type CreatorLinks } from "@/lib/creator-links";

type Creator = { handle: string; name: string; profileUrl?: string | null; avatarUrl?: string | null } & CreatorLinks;

const pill = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset";

/** A creator's name as a coloured pill; links to their main link unless `link` is false (inside another link). */
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
  if (!link || !creator.profileUrl) return <span className={className}>{content}</span>;
  return (
    <a
      href={creator.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} hover:opacity-80`}
      title={`Open ${creator.name}'s page`}
    >
      {content}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

/** One button per social profile the creator has. */
export function CreatorSocials({ creator }: { creator: Creator }) {
  const links = SOCIALS.filter((s) => creator[s.key]);
  if (links.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label={`${creator.name} online`}>
      {links.map((s) => (
        <li key={s.key}>
          <a
            href={creator[s.key]!}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium hover:opacity-80 ${s.tint}`}
          >
            {s.label} <ExternalLink className="size-3" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

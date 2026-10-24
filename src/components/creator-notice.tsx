import Link from "next/link";
import { ExternalLink, Heart } from "lucide-react";
import { CreatorSocials } from "@/components/creator";
import type { CreatorLinks } from "@/lib/creator-links";

type Creator = { handle: string; name: string; profileUrl?: string | null } & CreatorLinks;

/** The one-sentence version, for cards, captions and the footer. */
export function independentLine(name?: string) {
  return name
    ? `${name} is an independent creator, not affiliated with Creatour. Being featured here doesn't mean they endorse it. Their name, photos and logos belong to them.`
    : "Featured creators are independent and not affiliated with Creatour. Being featured doesn't mean they endorse it. Their names, photos and logos belong to them.";
}

/** Small print under a creator's name. */
export function CreatorNoticeLine({ name, className = "" }: { name?: string; className?: string }) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      {independentLine(name)}{" "}
      <Link href="/disclosure#credits" className="underline">
        Credits
      </Link>
    </p>
  );
}

/**
 * A boxed "go support them" panel: the independence notice, then their own links, so readers head to the creator's
 * platforms rather than stop here.
 */
export function SupportCreator({
  creator,
  sourceUrl,
  className = "",
}: {
  creator: Creator;
  /** The original guide, when the box sits on one of their itineraries. */
  sourceUrl?: string | null;
  className?: string;
}) {
  const home = sourceUrl ?? creator.websiteUrl ?? creator.profileUrl;
  return (
    <aside
      aria-label={`Support ${creator.name}`}
      className={`rounded-2xl border border-dashed border-line-strong bg-card p-5 ${className}`}
    >
      <p className="flex items-center gap-2 font-semibold">
        <Heart className="size-4 text-accent-2" aria-hidden />
        Support {creator.name}
      </p>
      <p className="mt-2 text-sm">
        {sourceUrl
          ? `This route is a short summary. ${creator.name}'s own guide has the stories, photos and tips that make it work.`
          : `${creator.name} did the travelling and wrote these trips up.`}{" "}
        Read their work, follow them, and share it with friends: that keeps creators like them making free guides.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {home && (
          <a
            href={home}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-background"
          >
            {sourceUrl ? "Read the original" : `Visit ${creator.name}`} <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
        <CreatorSocials creator={creator} />
      </div>
      <CreatorNoticeLine name={creator.name} className="mt-4 border-t border-line pt-3" />
    </aside>
  );
}

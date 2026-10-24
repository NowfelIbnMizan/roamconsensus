import Link from "next/link";
import { ExternalLink, Heart, Info } from "lucide-react";
import { CreatorSocials } from "@/components/creator";
import type { CreatorLinks } from "@/lib/creator-links";

type Creator = {
  handle: string;
  name: string;
  profileUrl?: string | null;
} & CreatorLinks;

/** The one-sentence version, for cards, captions and the footer. */
export function independentLine(name?: string) {
  return name
    ? `${name} is an independent creator, not affiliated with Creatour. Being featured here doesn't mean they endorse it. Their name, photos and logos belong to them.`
    : "Featured creators are independent and not affiliated with Creatour. Being featured doesn't mean they endorse it. Their names, photos and logos belong to them.";
}

/** Small print under a creator's name: the short version up front, the full sentence on the Credits page. */
export function CreatorNoticeLine({
  name,
  full = false,
  className = "",
}: {
  name?: string;
  /** The whole notice, for boxes where there's room. */
  full?: boolean;
  className?: string;
}) {
  return (
    <p className={`flex gap-1.5 text-xs text-muted ${className}`}>
      <Info className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>
        {full
          ? independentLine(name)
          : `${name ? `${name} is` : "Creators are"} independent. Not affiliated, not an endorsement.`}{" "}
        <Link href="/disclosure#credits" className="underline">
          Credits
        </Link>
      </span>
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
          ? `This is a summary. ${creator.name}'s own guide has the stories, photos and tips.`
          : `${creator.name} did the travelling and wrote these trips up.`}{" "}
        Read, follow and share: it keeps their guides free.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {home && (
          <a
            href={home}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-background"
          >
            {sourceUrl ? "Read the original" : `Visit ${creator.name}`}{" "}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
        <CreatorSocials creator={creator} />
      </div>
      <CreatorNoticeLine
        name={creator.name}
        full
        className="mt-4 border-t border-line pt-3"
      />
    </aside>
  );
}

/** Who runs the site and how the routes are gathered, in the owner's own voice. */
export function FellowTraveller({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <aside
      className={`rounded-2xl border border-dashed border-line-strong bg-card p-5 ${className}`}
    >
      <p className="font-semibold">Made by a fellow traveller</p>
      <p className="mt-2 text-sm">
        Creatour is a one-person project by {name}. I travel a lot, and I love
        learning from travel creators. I collect itineraries they&apos;ve shared
        publicly online, summarise them, and put them side by side so travellers
        can see where they agree. The creators are independent and haven&apos;t
        reviewed or endorsed this site. Picks, notes and &ldquo;my take&rdquo;
        comments are my own opinion. Their full guides are always better than my
        summary, so please read them, follow them and support their work.
      </p>
    </aside>
  );
}

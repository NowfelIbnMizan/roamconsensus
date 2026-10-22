import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, Mail } from "lucide-react";
import { EditorAvatar } from "@/components/editor-take";
import { getEditor, paragraphs } from "@/lib/editor";

export async function generateMetadata(): Promise<Metadata> {
  const e = await getEditor();
  return { title: `About ${e.name}`, description: e.tagline ?? `Who runs RoamConsensus and how it works.` };
}

export default async function AboutPage() {
  const e = await getEditor();
  return (
    <article className="max-w-2xl">
      <div className="flex items-center gap-4">
        <EditorAvatar editor={e} size="size-20 text-3xl" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Hi, I&apos;m {e.name}</h1>
          {e.tagline && <p className="mt-1 text-muted">{e.tagline}</p>}
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {paragraphs(e.bio).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {(e.email || e.instagramUrl) && (
        <p className="mt-5 flex flex-wrap gap-4 text-sm">
          {e.email && (
            <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 text-accent underline">
              <Mail className="size-4" aria-hidden /> {e.email}
            </a>
          )}
          {e.instagramUrl && (
            <a
              href={e.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-accent underline"
            >
              <AtSign className="size-4" aria-hidden /> Instagram
            </a>
          )}
        </p>
      )}

      <h2 className="mt-10 text-xl font-semibold">How RoamConsensus works</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>I read each creator&apos;s full guide and lay out their stops day by day.</li>
        <li>
          Places several creators recommend rise to the top, so you can see where they agree and where they don&apos;t.
        </li>
        <li>
          Where a creator didn&apos;t list a price, I add a typical current price and link where it came from. Where
          their price is out of date, I show both.
        </li>
        <li>
          My own opinions are marked as <strong>{e.name}&apos;s take</strong>, kept separate from the creator&apos;s
          content.
        </li>
        <li>
          Every itinerary links back to the creator&apos;s original guide. Read it: their photos, stories and tips are
          the real thing.
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold">For creators</h2>
      <p className="mt-3">
        RoamConsensus is not affiliated with or endorsed by the creators featured. If you&apos;re one of them and want
        something corrected, your own booking links used for your picks, or your itinerary removed,{" "}
        {e.email ? (
          <a href={`mailto:${e.email}`} className="text-accent underline">
            email me
          </a>
        ) : (
          "get in touch"
        )}{" "}
        and I&apos;ll act on it quickly.
      </p>
      <p className="mt-3 text-sm text-muted">
        How the site makes money:{" "}
        <Link href="/disclosure" className="underline">
          affiliate disclosure
        </Link>
        .
      </p>
    </article>
  );
}

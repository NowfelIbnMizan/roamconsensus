import type { Metadata } from "next";
import Image from "next/image";
import { AtSign, Mail } from "lucide-react";
import { FellowTraveller } from "@/components/creator-notice";
import { EditorAvatar } from "@/components/editor-take";
import { CONTACT_EMAIL } from "@/lib/contact";
import { getEditor, paragraphs } from "@/lib/editor";

// The owner's own travel photos (public/about), location data stripped. Faces of other people are blurred.
const PHOTOS = [
  { src: "/about/party.jpg", w: 900, h: 1200, alt: "Nowfel at a beach party, other faces blurred", caption: "Party mode" },
  { src: "/about/thali.jpg", w: 1200, h: 900, alt: "A thali spread with drinks", caption: "Ordered everything" },
  { src: "/about/fish.jpg", w: 1200, h: 900, alt: "Whole grilled fish on a banana leaf", caption: "Grilled fish, banana leaf" },
  { src: "/about/ferry.jpg", w: 1200, h: 904, alt: "Nowfel on a ferry deck at sunset", caption: "Ferry deck, golden hour" },
];

function Photos({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {PHOTOS.map((p, i) => (
        <figure
          key={p.src}
          className={`relative overflow-hidden rounded-2xl bg-line ${i === 0 ? "row-span-2" : ""} ${i === 3 ? "col-span-2" : ""}`}
        >
          <Image
            src={p.src}
            alt={p.alt}
            width={p.w}
            height={p.h}
            sizes="(min-width: 1024px) 280px, 50vw"
            className={`w-full object-cover ${i === 0 ? "h-full" : i === 3 ? "aspect-[16/9]" : "aspect-[4/3]"}`}
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pt-6 pb-2 text-xs font-medium text-white">
            {p.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const e = await getEditor();
  return { title: `About ${e.name}`, description: e.tagline ?? `Who runs Creatour and how it works.` };
}

export default async function AboutPage() {
  const e = await getEditor();
  // Always the site address: it forwards to the owner's inbox without showing their personal email.
  const email = CONTACT_EMAIL;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)]">
      <article className="max-w-2xl">
        <div className="flex items-center gap-4">
          <EditorAvatar editor={e} size="size-20 text-3xl" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Hi, I&apos;m {e.name}</h1>
            {e.tagline && <p className="mt-1 text-muted">{e.tagline}</p>}
          </div>
        </div>
        <FellowTraveller name={e.name} className="mt-6" />
        <div className="mt-6 space-y-4">
          {paragraphs(e.bio).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <Photos className="mt-6 lg:hidden" />
        <p className="mt-5 flex flex-wrap gap-4 text-sm">
          <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-accent underline">
            <Mail className="size-4" aria-hidden /> {email}
          </a>
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

        <h2 className="mt-10 text-xl font-semibold">How Creatour works</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>I read each creator&apos;s whole guide, not the listicle version, and lay their stops out day by day.</li>
          <li>
            When several creators pick the same place, it rises to the top. You see where they agree, and where they
            don&apos;t.
          </li>
          <li>
            No price from the creator? I add a current one and link the source. No source, no price: it says
            &ldquo;Price not listed&rdquo;.
          </li>
          <li>
            My opinions are labelled <strong>{e.name}&apos;s take</strong>, so they never get mixed up with the
            creator&apos;s.
          </li>
          <li>Every route links to the original guide. Read it: the photos and the stories are theirs.</li>
        </ul>

        <h2 id="for-creators" className="mt-10 scroll-mt-6 text-xl font-semibold">For creators</h2>
        <p className="mt-3">
          Featured on Creatour? Your route, your call. Want something fixed, your own booking links on your picks, or
          your itinerary taken down?{" "}
          <a href={`mailto:${email}`} className="text-accent underline">
            Email me
          </a>{" "}
          and I&apos;ll sort it fast. Creatour isn&apos;t affiliated with or endorsed by the creators featured.
        </p>
      </article>
      <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
        <Photos />
      </aside>
    </div>
  );
}

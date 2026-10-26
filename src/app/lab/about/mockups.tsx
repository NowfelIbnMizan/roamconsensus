import Link from "next/link";
import { ArrowRight, AtSign, BadgeCheck, BookOpen, Columns3, Mail, MessageSquareQuote, Route, Tag } from "lucide-react";
import { EditorAvatar } from "@/components/editor-take";
import { CONTACT_EMAIL } from "@/lib/contact";
import { paragraphs, type Editor } from "@/lib/editor";

const email = CONTACT_EMAIL;

const HOW = [
  { icon: BookOpen, title: "Read the full guide", text: "Each creator's stops, laid out day by day." },
  { icon: Columns3, title: "Line them up", text: "Places several creators recommend rise to the top." },
  { icon: Tag, title: "Check prices", text: "Missing or old prices get a current one, with its source." },
  { icon: MessageSquareQuote, title: "Mark my take", text: "My opinions are labelled, apart from the creator's content." },
  { icon: Route, title: "Link back", text: "Every route links to the original guide. Read it." },
];

function Contact({ e, className = "" }: { e: Editor; className?: string }) {
  return (
    <p className={`flex flex-wrap gap-2 ${className}`}>
      <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
        <Mail className="size-4" aria-hidden /> Email me
      </a>
      {e.instagramUrl && (
        <a href={e.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm">
          <AtSign className="size-4" aria-hidden /> Instagram
        </a>
      )}
    </p>
  );
}

function ForCreators({ className = "" }: { className?: string }) {
  return (
    <section id="for-creators" className={`scroll-mt-6 rounded-2xl border border-line bg-card p-5 ${className}`}>
      <p className="eyebrow">For creators</p>
      <h2 className="mt-1 text-lg font-semibold">Your route, your call</h2>
      <ul className="mt-3 space-y-1.5 text-sm">
        {["Fix something", "Use your own booking links", "Remove your itinerary"].map((x) => (
          <li key={x} className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-accent" aria-hidden /> {x}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">
        Not affiliated with or endorsed by the creators featured.{" "}
        <a href={`mailto:${email}`} className="text-accent underline">Email me</a> and I&apos;ll act on it quickly.
      </p>
    </section>
  );
}

const fellow = (name: string) =>
  `Creatour is a one-person project by ${name}. I collect itineraries travel creators share publicly, summarise them and put them side by side so you can see where they agree. The creators are independent and haven't reviewed or endorsed this site.`;

/* A: hero + 5 steps as icon tiles + bio folded + creators card. */
export function MockA({ e }: { e: Editor }) {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4">
        <EditorAvatar editor={e} size="size-16 text-2xl" />
        <div>
          <p className="eyebrow">About Creatour</p>
          <h1 className="text-3xl font-semibold tracking-tight">Hi, I&apos;m {e.name}</h1>
        </div>
      </div>
      {e.tagline && <p className="mt-4 max-w-2xl text-lg">{e.tagline}</p>}
      <Contact e={e} className="mt-4" />

      <h2 className="mt-10 text-xl font-semibold">How it works</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {HOW.map((h, i) => (
          <li key={h.title} className="rounded-2xl border border-line bg-card p-4">
            <span className="flex items-center gap-2 text-accent">
              <h.icon className="size-5" aria-hidden />
              <span className="text-xs font-medium">{i + 1}</span>
            </span>
            <p className="mt-2 font-semibold">{h.title}</p>
            <p className="mt-1 text-sm text-muted">{h.text}</p>
          </li>
        ))}
      </ol>

      <details className="mt-8 max-w-2xl">
        <summary className="cursor-pointer font-medium text-accent">More about me and this project</summary>
        <div className="mt-3 space-y-3">
          <p>{fellow(e.name)}</p>
          {paragraphs(e.bio).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </details>

      <ForCreators className="mt-8 max-w-2xl" />
      <Link href="/" className="mt-8 inline-flex items-center gap-1 font-medium text-accent hover:underline">
        Start planning <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/* B: two columns. Person card sticky on the left; how it works + for creators + questions on the right. */
export function MockB({ e }: { e: Editor }) {
  const faq = [
    ["Is it free?", "Yes. Creatour is free and earns nothing."],
    ["Who travelled these routes?", "The creators did. I collect and compare what they shared publicly."],
    ["Where do prices come from?", "The creator's guide, or a current price with a linked source. No source means \"Price not listed\"."],
  ];
  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-line bg-card p-5">
          <EditorAvatar editor={e} size="size-20 text-3xl" />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{e.name}</h1>
          {e.tagline && <p className="mt-1 text-muted">{e.tagline}</p>}
          <p className="fine-print mt-3">One-person project. Fellow traveller, not affiliated with the creators.</p>
          <Contact e={e} className="mt-4" />
        </div>
      </aside>
      <div className="min-w-0 max-w-2xl">
        <p className="eyebrow">How Creatour works</p>
        <ol className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
          {HOW.map((h, i) => (
            <li key={h.title} className="flex gap-4 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{i + 1}</span>
              <span>
                <span className="block font-semibold">{h.title}</span>
                <span className="text-sm text-muted">{h.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <ForCreators className="mt-8" />
        <p className="eyebrow mt-8">Questions</p>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {faq.map(([q, a]) => (
            <li key={q}>
              <details className="py-3">
                <summary className="cursor-pointer font-medium">{q}</summary>
                <p className="mt-2 text-sm text-muted">{a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* C: planner pitch first. Big line on what the site does, a mock "3 of 4 agree" card, then the person, then creators. */
export function MockC({ e }: { e: Editor }) {
  return (
    <div className="max-w-4xl">
      <p className="eyebrow">About</p>
      <h1 className="mt-1 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">See where travel creators agree. Then build your trip.</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { n: "1", t: "Pick a city", d: "Routes from several creators, side by side." },
          { n: "2", t: "See who agrees", d: "\"3 of 4 creators\" means it's worth your time." },
          { n: "3", t: "Build your trip", d: "Add stops to the cart: day plan, map, budget." },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-line bg-card p-5">
            <span className="text-3xl font-semibold text-accent">{s.n}</span>
            <p className="mt-2 font-semibold">{s.t}</p>
            <p className="mt-1 text-sm text-muted">{s.d}</p>
          </div>
        ))}
      </div>
      <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
        Start planning <ArrowRight className="size-4" aria-hidden />
      </Link>

      <section className="mt-12 flex flex-col gap-5 border-t border-line pt-8 sm:flex-row">
        <EditorAvatar editor={e} size="size-16 text-2xl" />
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold">Made by {e.name}, a fellow traveller</h2>
          <p className="mt-2">{fellow(e.name)}</p>
          <p className="mt-2 text-sm text-muted">
            Prices without a creator price get a current one with its source. My opinions are labelled &ldquo;{e.name}&apos;s take&rdquo;.
          </p>
          <Contact e={e} className="mt-4" />
        </div>
      </section>
      <ForCreators className="mt-10 max-w-2xl" />
    </div>
  );
}

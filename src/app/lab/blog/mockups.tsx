import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Sparkles, Stamp } from "lucide-react";
import { PostCover, formatDate } from "@/components/post-cover";
import { Thumb } from "@/components/thumb";

export type LabPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string;
  destination: { slug: string; name: string } | null;
};
export type LabCity = { slug: string; name: string; country: string; heroPhotoUrl: string | null; routes: number };

// Mockup-only sample posts so the list has something to show. Never stored anywhere.
export const SAMPLE_POSTS: LabPost[] = [
  { slug: "s1", title: "[Sample] Where 4 creators agree in Bangkok", excerpt: "The stalls, temples and rooftops that show up in almost every Bangkok route, and the ones only one creator loves.", coverUrl: null, publishedAt: "2026-10-20T00:00:00Z", destination: { slug: "bangkok", name: "Bangkok" } },
  { slug: "s2", title: "[Sample] Kyoto in 2 days without the crowds", excerpt: "Early starts, quiet shrines and where the creators eat lunch.", coverUrl: null, publishedAt: "2026-10-12T00:00:00Z", destination: { slug: "kyoto", name: "Kyoto" } },
  { slug: "s3", title: "[Sample] Bali on a budget: what the routes skip", excerpt: "Cheap eats, free beaches and the paid spots that are worth it.", coverUrl: null, publishedAt: "2026-10-03T00:00:00Z", destination: { slug: "bali", name: "Bali" } },
  { slug: "s4", title: "[Sample] eSIM or local SIM in Seoul?", excerpt: "What each option costs for a 5-day trip.", coverUrl: null, publishedAt: "2026-09-28T00:00:00Z", destination: { slug: "seoul", name: "Seoul" } },
];

const PLAN = [
  { href: "/", icon: Compass, title: "Pick a city", text: "See where creators agree." },
  { href: "/quiz", icon: Sparkles, title: "Find your match", text: "A route for your days and style." },
  { href: "/visa", icon: Stamp, title: "Visa check", text: "Do you need one? 10 seconds." },
];

function Meta({ p }: { p: LabPost }) {
  return (
    <p className="text-xs text-muted">
      {formatDate(p.publishedAt)}
      {p.destination && ` · ${p.destination.name}`}
    </p>
  );
}

/* A: magazine. Lead post big, the rest in a grid, city pills on top. Empty: 3 planner tiles. */
export function MockA({ posts, cities }: { posts: LabPost[]; cities: LabCity[] }) {
  const [lead, ...rest] = posts;
  return (
    <>
      <p className="eyebrow">Creatour blog</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Trip ideas, backed by creators</h1>
      {posts.length === 0 ? (
        <>
          <p className="mt-2 max-w-xl text-muted">First posts are on the way. Meanwhile, the planner is ready:</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {PLAN.map((x) => (
              <li key={x.title}>
                <Link href={x.href} className="flex h-full flex-col rounded-2xl border border-line bg-card p-5 hover:border-accent">
                  <x.icon className="size-6 text-accent" aria-hidden />
                  <span className="mt-3 font-semibold">{x.title}</span>
                  <span className="mt-1 text-sm text-muted">{x.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <span className="rounded-full bg-foreground px-3.5 py-2 text-sm font-medium text-background">All</span>
            {[...new Map(posts.filter((p) => p.destination).map((p) => [p.destination!.slug, p.destination!])).values()].map((d) => (
              <span key={d.slug} className="shrink-0 rounded-full border border-line bg-card px-3.5 py-2 text-sm">{d.name}</span>
            ))}
          </div>
          <Link href="#" className="group mt-6 grid overflow-hidden rounded-3xl border border-line bg-card md:grid-cols-2">
            <PostCover post={lead} sizes="640px" className="aspect-[16/10] h-full" />
            <div className="flex flex-col justify-center p-6">
              <Meta p={lead} />
              <h2 className="mt-2 text-2xl font-semibold group-hover:text-accent">{lead.title}</h2>
              {lead.excerpt && <p className="mt-2 text-muted">{lead.excerpt}</p>}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">Read <ArrowRight className="size-4" aria-hidden /></span>
            </div>
          </Link>
          <ul className="mt-6 grid gap-5 sm:grid-cols-3">
            {rest.map((p) => (
              <li key={p.slug}>
                <Link href="#" className="group block overflow-hidden rounded-2xl border border-line bg-card">
                  <PostCover post={p} sizes="400px" />
                  <div className="p-4">
                    <Meta p={p} />
                    <h3 className="mt-1 font-semibold group-hover:text-accent">{p.title}</h3>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="sr-only">{cities.length}</p>
    </>
  );
}

/* B: reading list. Text-first rows with a small thumb; a "Plan instead" side rail. Empty: the rail becomes the page. */
export function MockB({ posts, cities }: { posts: LabPost[]; cities: LabCity[] }) {
  const rail = (
    <aside className="rounded-2xl border border-line bg-card p-5 lg:sticky lg:top-6">
      <p className="eyebrow">Ready to plan?</p>
      <ul className="mt-3 space-y-2">
        {cities.slice(0, 6).map((c) => (
          <li key={c.slug}>
            <Link href={`/destinations/${c.slug}`} className="flex items-center justify-between text-sm hover:text-accent">
              <span className="font-medium">{c.name}</span>
              <span className="text-muted">{c.routes} routes</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">All cities <ArrowRight className="size-4" aria-hidden /></Link>
    </aside>
  );
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-1 text-muted">Short reads to plan smarter. No fluff, no sponsored lists.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center">
            <BookOpen className="mx-auto size-8 text-muted" strokeWidth={1.5} aria-hidden />
            <p className="mt-3 font-semibold">First posts coming soon</p>
            <p className="mt-1 text-sm text-muted">The city guides and routes are already live. Start there.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href="#" className="group flex gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <Meta p={p} />
                    <h2 className="mt-1 text-lg font-semibold group-hover:text-accent">{p.title}</h2>
                    {p.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>}
                  </div>
                  <PostCover post={p} sizes="160px" className="aspect-square w-24 shrink-0 rounded-xl sm:w-32" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {rail}
      </div>
    </>
  );
}

/* C: guides by city. Each city is a row: photo, its posts, and its routes. Empty: same rows, "routes ready now". */
export function MockC({ posts, cities }: { posts: LabPost[]; cities: LabCity[] }) {
  const shown = posts.length ? cities.filter((c) => posts.some((p) => p.destination?.slug === c.slug)) : cities.slice(0, 6);
  return (
    <>
      <p className="eyebrow">City guides</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Read up, then plan</h1>
      <ul className="mt-6 space-y-4">
        {shown.map((c) => {
          const mine = posts.filter((p) => p.destination?.slug === c.slug);
          return (
            <li key={c.slug} className="grid overflow-hidden rounded-2xl border border-line bg-card sm:grid-cols-[12rem_minmax(0,1fr)]">
              <Thumb url={c.heroPhotoUrl} category="EXPERIENCE" sizes="320px" className="h-32 w-full sm:h-full" />
              <div className="p-4">
                <p className="eyebrow">{c.country}</p>
                <h2 className="text-xl font-semibold">{c.name}</h2>
                {mine.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {mine.map((p) => (
                      <li key={p.slug}>
                        <Link href="#" className="text-sm font-medium hover:text-accent">{p.title}</Link>
                        <span className="text-xs text-muted"> · {formatDate(p.publishedAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">Guide coming soon. {c.routes} creator routes ready now.</p>
                )}
                <Link href={`/destinations/${c.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  Plan {c.name} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

import Link from "next/link";
import { CreatorAvatar } from "@/components/creator-avatar";
import { Thumb } from "@/components/thumb";
import { categoryLabel } from "@/lib/format";
import { placeHref } from "@/lib/place";
import { Actions, Back, FromPrice, Hero, load } from "../shared";

/** C: the story. Name on the photo, one big quote leads, the rest read like a guestbook; facts sit in a side card. */
export default async function StoryLab() {
  const lab = await load();
  const { p, d, creators, quotes, nearby } = lab;
  const [lead, ...rest] = quotes;
  return (
    <div className="mx-auto max-w-5xl">
      <Back lab={lab} />
      <div className="relative mt-3 overflow-hidden rounded-3xl">
        <Hero lab={lab} className="aspect-[4/5] sm:aspect-[21/9]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
          <p className="text-sm opacity-85">
            {p.area} · {categoryLabel[p.category]}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">{p.name}</h1>
          <p className="mt-2 text-sm opacity-90">
            {creators.length} of {p.creatorCount} creators put it on their route
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          {lead && (
            <figure>
              <blockquote className="font-display text-2xl leading-snug text-pretty sm:text-3xl">
                &ldquo;{lead.note}&rdquo;
              </blockquote>
              <figcaption className="mt-3 flex items-center gap-2 text-sm text-muted">
                <CreatorAvatar creator={lead.creator} size="sm" /> {lead.creator.name}, Day {lead.day} of{" "}
                <Link href={`/itineraries/${lead.itinerary.slug}`} className="underline">
                  {lead.itinerary.title}
                </Link>
              </figcaption>
            </figure>
          )}
          <ul className="mt-6 space-y-4 border-l-2 border-line pl-4">
            {rest.map((m) => (
              <li key={m.id}>
                <p className="text-pretty">&ldquo;{m.note}&rdquo;</p>
                <p className="mt-1 text-sm text-muted">
                  {m.creator.name} ·{" "}
                  <Link href={`/itineraries/${m.itinerary.slug}`} className="underline">
                    Day {m.day}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
          {p.blurb && <p className="mt-6 text-muted text-pretty">{p.blurb}</p>}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-card p-4 md:sticky md:top-20">
          <p className="text-2xl font-semibold tabular-nums">
            <FromPrice lab={lab} />
          </p>
          {p.tip && <p className="mt-2 text-sm text-muted">Tip: {p.tip}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Actions lab={lab} compact />
          </div>
          <p className="mt-5 text-xs font-medium tracking-wide text-muted uppercase">Close by</p>
          <ul className="mt-2 space-y-2">
            {nearby.slice(0, 4).map((o) => (
              <li key={o.slug}>
                <Link href={placeHref(d.slug, o.slug)} className="flex items-center gap-2.5 text-sm">
                  <Thumb url={o.photoUrl} category={o.category} className="size-10 shrink-0 rounded-lg" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.name}</span>
                    <span className="text-xs text-muted">~{o.drive} drive</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CreatorAvatar } from "@/components/creator-avatar";
import { Thumb } from "@/components/thumb";
import { categoryLabel } from "@/lib/format";
import { placeHref } from "@/lib/place";
import { Actions, Back, Faces, FromPrice, Hero, load } from "../shared";

/** A: the verdict first. Three facts, then the creators' own words in a swipe row, actions pinned on a phone. */
export default async function VerdictLab() {
  const lab = await load();
  const { p, d, creators, quotes, days, nearby } = lab;
  return (
    <div className="mx-auto max-w-4xl pb-24 sm:pb-0">
      <Back lab={lab} />
      <Hero lab={lab} className="mt-3 aspect-[16/10] rounded-2xl sm:aspect-[21/9]" />
      <p className="mt-4 text-sm text-muted">
        {p.area} · {categoryLabel[p.category]}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{p.name}</h1>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-card text-center">
        <div className="p-3">
          <dt className="text-xs text-muted">Creators</dt>
          <dd className="mt-0.5 flex items-center justify-center gap-1 font-semibold">
            <CheckCircle2 className="size-4 text-accent" aria-hidden />
            {creators.length} of {p.creatorCount}
          </dd>
        </div>
        <div className="p-3">
          <dt className="text-xs text-muted">Entry</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            <FromPrice lab={lab} />
          </dd>
        </div>
        <div className="p-3">
          <dt className="text-xs text-muted">Usually</dt>
          <dd className="mt-0.5 font-semibold">Day {Math.min(...days)}</dd>
        </div>
      </dl>

      {p.blurb && <p className="mt-4 text-pretty">{p.blurb}</p>}
      {p.tip && <p className="mt-2 text-sm text-muted">Tip: {p.tip}</p>}

      <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
        <Actions lab={lab} />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">In their words</h2>
          <Faces lab={lab} />
        </div>
        <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
          {quotes.map((m) => (
            <li key={m.id} className="w-[80%] shrink-0 snap-start rounded-2xl border border-line bg-card p-4 sm:w-auto">
              <p className="text-pretty">&ldquo;{m.note}&rdquo;</p>
              <p className="mt-3 flex items-center gap-2 text-sm">
                <CreatorAvatar creator={m.creator} size="sm" />
                <span className="min-w-0">
                  <span className="block font-medium">{m.creator.name}</span>
                  <Link href={`/itineraries/${m.itinerary.slug}`} className="block truncate text-muted underline">
                    Day {m.day} · {m.itinerary.title}
                  </Link>
                </span>
              </p>
            </li>
          ))}
        </ul>
        {p.mentions.length > quotes.length && (
          <p className="mt-2 text-sm text-muted">
            Also on:{" "}
            {p.mentions
              .filter((m) => !m.note)
              .map((m, n) => (
                <span key={m.id}>
                  {n > 0 && ", "}
                  <Link href={`/itineraries/${m.itinerary.slug}`} className="underline">
                    {m.creator.name}, Day {m.day}
                  </Link>
                </span>
              ))}
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Close by</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {nearby.map((o) => (
            <li key={o.slug}>
              <Link href={placeHref(d.slug, o.slug)} className="block">
                <Thumb url={o.photoUrl} category={o.category} className="aspect-[4/3] w-full rounded-xl" />
                <span className="mt-1.5 block truncate text-sm font-medium">{o.name}</span>
                <span className="text-xs text-muted">~{o.drive} drive</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-[1000] flex gap-2 border-t border-line bg-background/95 px-4 py-2.5 backdrop-blur sm:hidden">
        <Actions lab={lab} compact />
      </div>
    </div>
  );
}

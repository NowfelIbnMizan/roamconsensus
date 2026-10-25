import Link from "next/link";
import { CheckCircle2, ChevronDown, Plus } from "lucide-react";
import { CreatorAvatar } from "@/components/creator-avatar";
import { Thumb } from "@/components/thumb";
import { TripMap } from "@/components/trip-map";
import { categoryHex } from "@/lib/map";
import { categoryLabel } from "@/lib/format";
import { placeHref } from "@/lib/place";
import { Actions, Back, Faces, FromPrice, Hero, load } from "../shared";

/** B: plan around it. A short header, then where it sits in a day: what is close, how far, add it next. */
export default async function PlanLab() {
  const lab = await load();
  const { p, d, creators, days, nearby, stops } = lab;
  return (
    <div className="mx-auto max-w-5xl">
      <Back lab={lab} />
      <div className="mt-3 flex gap-4">
        <Hero lab={lab} className="size-24 shrink-0 rounded-2xl sm:size-32" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {p.area} · {categoryLabel[p.category]} ·{" "}
            <span className="font-medium text-foreground tabular-nums">
              <FromPrice lab={lab} />
            </span>
          </p>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-sm font-medium text-accent">
            <CheckCircle2 className="size-4" aria-hidden /> {creators.length} of {p.creatorCount} creators
          </p>
        </div>
      </div>
      {p.blurb && <p className="mt-4 max-w-2xl text-pretty">{p.blurb}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Actions lab={lab} />
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Build a day around it</h2>
        <p className="mt-1 text-sm text-muted">
          Creators visit on day {Math.min(...days)} to {Math.max(...days)}. {p.tip}
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_340px]">
          <TripMap stops={stops} className="h-64 md:h-full md:min-h-96" />
          <ol className="divide-y divide-line rounded-2xl border border-line bg-card">
            {nearby.map((o, n) => (
              <li key={o.slug} className="flex items-center gap-3 p-2.5">
                <span className="relative shrink-0">
                  <Thumb url={o.photoUrl} category={o.category} className="size-12 rounded-lg" />
                  <span
                    className="absolute -top-1.5 -left-1.5 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-card"
                    style={{ background: categoryHex[o.category] }}
                  >
                    {n + 1}
                  </span>
                </span>
                <Link href={placeHref(d.slug, o.slug)} className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-medium">{o.name}</span>
                  <span className="text-xs text-muted">
                    +{o.drive} · {categoryLabel[o.category]}
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label={`Add ${o.name}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line hover:border-accent"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <details className="group mt-8 rounded-2xl border border-line bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <Faces lab={lab} />
          <span className="flex-1 font-medium">What {p.mentions.length} creators say</span>
          <ChevronDown className="size-4 text-muted transition group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="divide-y divide-line border-t border-line">
          {p.mentions.map((m) => (
            <li key={m.id} className="flex gap-3 p-4 text-sm">
              <CreatorAvatar creator={m.creator} size="sm" />
              <div className="min-w-0">
                <p className="font-medium">
                  {m.creator.name}{" "}
                  <Link href={`/itineraries/${m.itinerary.slug}`} className="font-normal text-muted underline">
                    Day {m.day} · {m.itinerary.title}
                  </Link>
                </p>
                {m.note && <p className="mt-1 text-muted">&ldquo;{m.note}&rdquo;</p>}
              </div>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

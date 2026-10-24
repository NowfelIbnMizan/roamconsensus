import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCreator, getCreatorHandles } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { CreatorSocials } from "@/components/creator";
import { CreatorAvatar } from "@/components/creator-avatar";

export async function generateStaticParams() {
  return getCreatorHandles();
}

export async function generateMetadata({ params }: PageProps<"/creators/[handle]">): Promise<Metadata> {
  const c = await getCreator((await params).handle);
  return c ? { title: c.name, description: c.bio ?? `${c.name}'s travel itineraries on Creatour.` } : {};
}

export default async function CreatorPage({ params }: PageProps<"/creators/[handle]">) {
  const creator = await getCreator((await params).handle);
  if (!creator) notFound();

  return (
    <>
      <Link href="/creators" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        All creators
      </Link>
      <div className="mt-4 flex items-center gap-4">
        <CreatorAvatar creator={creator} size="lg" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{creator.name}</h1>
          <p className="text-muted">
            {creator.itineraries.length} {creator.itineraries.length === 1 ? "itinerary" : "itineraries"} on Creatour
          </p>
        </div>
      </div>
      {creator.bio && <p className="mt-4 max-w-2xl">{creator.bio}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CreatorSocials creator={creator} />
      </div>
      <h2 className="mt-10 text-lg font-semibold">Itineraries</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {creator.itineraries.map((it) => (
          <li key={it.slug}>
            <Link
              href={`/itineraries/${it.slug}`}
              className="block h-full rounded-xl border border-line p-4 hover:border-accent"
            >
              <span className="font-medium">{it.title}</span>
              <span className="mt-1 block text-sm text-muted">
                {it.destination.name} · {it.days} {it.days === 1 ? "day" : "days"} · {tierLabel[it.tier]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

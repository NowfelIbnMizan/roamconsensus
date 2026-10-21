import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCreator, getCreatorHandles } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { CreatorChip, CreatorSocials } from "@/components/creator";

export async function generateStaticParams() {
  return getCreatorHandles();
}

export async function generateMetadata({ params }: PageProps<"/creators/[handle]">): Promise<Metadata> {
  const c = await getCreator((await params).handle);
  return c ? { title: c.name } : {};
}

export default async function CreatorPage({ params }: PageProps<"/creators/[handle]">) {
  const creator = await getCreator((await params).handle);
  if (!creator) notFound();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{creator.name}</h1>
      <p className="text-muted">
        @{creator.handle} on {creator.platform.toLowerCase()}
      </p>
      {creator.bio && <p className="mt-3">{creator.bio}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CreatorChip creator={creator} />
        <CreatorSocials creator={creator} />
      </div>
      <h2 className="mt-10 text-lg font-semibold">Itineraries</h2>
      <ul className="mt-3 space-y-2">
        {creator.itineraries.map((it) => (
          <li key={it.slug}>
            <Link href={`/itineraries/${it.slug}`} className="underline">
              {it.title}
            </Link>{" "}
            <span className="text-sm text-muted">
              {it.destination.name} · {tierLabel[it.tier]} · {it.days} days
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

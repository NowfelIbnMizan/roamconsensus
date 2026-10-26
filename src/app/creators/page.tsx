import type { Metadata } from "next";
import { PageGuide } from "@/components/page-guide";
import Link from "next/link";
import { getCreators } from "@/lib/data";
import { CreatorNoticeLine } from "@/components/creator-notice";
import { CreatorsList } from "./creators-list";

export const metadata: Metadata = {
  title: "Travel creators",
  description:
    "The travel bloggers and creators whose itineraries Creatour compares, with their bios, socials and routes.",
};

export default async function CreatorsPage() {
  // Most routes first: the creators you're most likely to plan with lead the list.
  const creators = (await getCreators()).toSorted(
    (a, b) => b.itineraries.length - a.itineraries.length || a.name.localeCompare(b.name),
  );
  const itineraryCount = creators.reduce((n, c) => n + c.itineraries.length, 0);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">The creators</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {creators.length} creators, {itineraryCount} routes. They did the
        travelling: give them a read and a follow.
      </p>
      <CreatorNoticeLine className="mt-3 max-w-2xl" />

      <PageGuide id="creators" className="mt-6" />
      <CreatorsList creators={creators} />

      <p className="mt-10 text-sm text-muted">
        Are you one of these creators? You can update your bio and links or ask
        for removal.{" "}
        <Link href="/about#for-creators" className="underline">
          Get in touch
        </Link>
        .
      </p>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SharedTripView } from "../../trip/shared-trip";

export const metadata: Metadata = {
  title: "A trip plan shared with you",
  robots: { index: false },
};

/** Short share link: looks up the trip and shows it here, so the address people copy stays short. */
export default async function ShortTripLink({ params }: PageProps<"/t/[code]">) {
  const { code } = await params;
  const link = await db.shareLink.findUnique({ where: { code } });
  if (!link) notFound();
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">A trip plan shared with you</h1>
      <p className="mt-1 text-muted">Built from travel creators&apos; routes on Creatour.</p>
      <div className="mt-8">
        <SharedTripView token={link.payload} />
      </div>
    </>
  );
}

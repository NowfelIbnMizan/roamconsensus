import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "A trip plan shared with you",
  robots: { index: false },
};

/** Short share link: looks up the trip and opens it on /trip, where the full link has always worked. */
export default async function ShortTripLink({ params }: PageProps<"/t/[code]">) {
  const { code } = await params;
  const link = await db.shareLink.findUnique({ where: { code } });
  if (!link) notFound();
  redirect(`/trip?t=${link.payload}`);
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Settings } from "lucide-react";
import { PageGuide } from "@/components/page-guide";
import { isAdmin } from "@/lib/admin/auth";
import { googleLoginEnabled } from "@/lib/auth";
import { canSendEmail } from "@/lib/email";
import { getDestinations } from "@/lib/data";
import { MyTrips } from "./my-trips";
import { MyTravel } from "./my-travel";

export const metadata: Metadata = { title: "My trips", robots: { index: false } };

/** Shortcut into the admin for the site owner's Google account (ADMIN_EMAILS). */
async function AdminLink() {
  if (!(await isAdmin())) return null;
  return (
    <Link
      href="/admin"
      className="mb-6 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
    >
      <Settings className="size-4" aria-hidden /> Open admin
    </Link>
  );
}

async function Travel() {
  const cities = (await getDestinations()).filter((d) => !d.isSample).map(({ slug, name }) => ({ slug, name }));
  return <MyTravel cities={cities} />;
}

export default function MyTripsPage() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">My trips</h1>
      <Suspense>
        <AdminLink />
      </Suspense>
      <PageGuide id="my-trips" />
      {googleLoginEnabled() ? (
        <MyTrips canEmail={canSendEmail()} />
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          Accounts are coming soon. Your trip plan is saved on this device for now.
        </p>
      )}
      <Suspense>
        <Travel />
      </Suspense>
    </>
  );
}

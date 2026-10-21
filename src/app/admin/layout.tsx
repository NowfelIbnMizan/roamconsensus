import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// Everything under /admin reads the login cookie and live data, so it renders per request behind this boundary.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <Suspense fallback={<p className="text-muted">Loading…</p>}>{children}</Suspense>;
}

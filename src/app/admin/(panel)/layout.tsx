import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { logOutAction } from "@/lib/admin/actions";

const links = [
  { href: "/admin", label: "Destinations" },
  { href: "/admin/health", label: "City health" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/vendors", label: "Booking sites & coupons" },
  { href: "/admin/esim", label: "eSIM plans" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/about", label: "About me" },
  { href: "/admin/subscribers", label: "Email sign-ups" },
];

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div>
      <nav className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-4 text-sm">
        <span className="font-semibold">Admin</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-muted hover:text-foreground"
          >
            {l.label}
          </Link>
        ))}
        <a href="/admin/export" className="text-muted hover:text-foreground">
          Download backup
        </a>
        <form action={logOutAction} className="ml-auto">
          <button type="submit" className="text-muted hover:text-foreground">
            Log out
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}

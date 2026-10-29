import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { logOutAction } from "@/lib/admin/actions";

const links = [
  { href: "/admin", label: "Cities" },
  { href: "/admin/health", label: "City health" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/blog", label: "Blog" },
];
const more = [
  { href: "/admin/vendors", label: "Booking sites & coupons" },
  { href: "/admin/esim", label: "eSIM plans" },
  { href: "/admin/about", label: "About me" },
  { href: "/admin/subscribers", label: "Email sign-ups" },
];

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div>
      <nav className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-foreground px-4 py-2.5 text-sm text-background">
        <span className="font-semibold">Admin</span>
        <span className="hidden opacity-70 md:inline">Saved changes go live right away.</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 md:ml-auto">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="opacity-80 hover:opacity-100">
              {l.label}
            </Link>
          ))}
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 opacity-80 hover:opacity-100">
              More <ChevronDown className="size-3.5" aria-hidden />
            </summary>
            <div className="absolute right-0 z-[1150] mt-2 w-56 rounded-xl border border-line bg-card p-1.5 text-foreground shadow-xl">
              {more.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 hover:bg-line/50">
                  {l.label}
                </Link>
              ))}
              <a href="/admin/export" className="block rounded-lg px-3 py-2 hover:bg-line/50">
                Download backup
              </a>
              <form action={logOutAction}>
                <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-muted hover:bg-line/50">
                  Log out
                </button>
              </form>
            </div>
          </details>
        </span>
      </nav>
      {children}
    </div>
  );
}

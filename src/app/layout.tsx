import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/email";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Compass, Search } from "lucide-react";
import { CartLink } from "@/components/cart-link";
import { CurrencyPicker, CurrencyProvider } from "@/components/money";
import { ThemeToggle, themeScript } from "@/components/theme";
import { InstallApp } from "@/components/install-app";
import { MobileNav } from "@/components/mobile-nav";
import { EmailSignup } from "@/components/email-signup";
import { getRates } from "@/lib/rates";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  // Lets the bottom tab bar sit above the iPhone home indicator.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export const metadata: Metadata = {
  // Makes share-image and canonical URLs absolute.
  metadataBase: new URL(siteUrl()),
  openGraph: { siteName: "RoamConsensus", type: "website" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Roam", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  title: { default: "RoamConsensus", template: "%s · RoamConsensus" },
  description: "Compare travel creators' itineraries and see where they agree.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { rates } = await getRates();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The theme script sets data-theme before React loads.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <CurrencyProvider rates={rates}>
          <header className="border-b border-line">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Compass className="size-5 text-accent" aria-hidden />
                RoamConsensus
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted sm:gap-4">
                <Link href="/#destinations" className="hidden hover:text-foreground md:inline">
                  Destinations
                </Link>
                <Link href="/creators" className="hidden hover:text-foreground md:inline">
                  Creators
                </Link>
                <Link href="/itineraries" className="hidden hover:text-foreground sm:inline">
                  Find a trip
                </Link>
                <Link href="/visa" className="hidden hover:text-foreground sm:inline">
                  Visa check
                </Link>
                <Link href="/about" className="hidden hover:text-foreground md:inline">
                  About
                </Link>
                <Link
                  href="/search"
                  aria-label="Search"
                  className="hidden size-8 items-center justify-center rounded-full hover:bg-line hover:text-foreground sm:flex"
                >
                  <Search className="size-4" aria-hidden />
                </Link>
                <ThemeToggle />
                <CurrencyPicker />
                <span className="hidden sm:inline-flex">
                  <CartLink />
                </span>
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
            {/* Pages are prerendered whole; this only shows if a page has to load its data at request time, which
                otherwise fails with a blocking-route error. */}
            <Suspense fallback={<p className="text-muted">Loading…</p>}>{children}</Suspense>
          </main>
          <footer className="border-t border-line">
            <div className="mx-auto max-w-5xl px-4 pt-6">
              <div className="max-w-md">
                <EmailSignup label="New destinations and creator itineraries, by email" button="Sign up" />
              </div>
            </div>
            <p className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted">
              Some links are affiliate links: we may earn a commission at no extra cost to you. RoamConsensus is not
              affiliated with the creators featured.{" "}
              <Link href="/disclosure" className="underline">
                Full disclosure
              </Link>
              {" · "}
              <Link href="/creators" className="underline">
                Creators
              </Link>
              {" · "}
              <Link href="/about" className="underline">
                About and contact
              </Link>
            </p>
            <p className="mx-auto max-w-5xl px-4 pb-24 text-xs text-muted sm:pb-6">
              <InstallApp />
            </p>
          </footer>
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
        </CurrencyProvider>
      </body>
    </html>
  );
}

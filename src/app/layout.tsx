import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/email";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Compass, Search } from "lucide-react";
import { CartLink } from "@/components/cart-link";
import { CurrencyPicker, CurrencyProvider } from "@/components/money";
import { ThemeToggle, themeScript } from "@/components/theme";
import { InstallApp } from "@/components/install-app";
import { MobileNav } from "@/components/mobile-nav";
import { AccountButton } from "@/components/account-button";
import { CartSync } from "@/components/cart-sync";
import { googleLoginEnabled } from "@/lib/auth";
import { VisitorStats } from "@/components/visitor-stats";
import { EmailSignup } from "@/components/email-signup";
import { getRates } from "@/lib/rates";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Headings: a warm serif.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  // Lets the bottom tab bar sit above the iPhone home indicator.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  // Makes share-image and canonical URLs absolute.
  metadataBase: new URL(siteUrl()),
  openGraph: { siteName: "Creatour", type: "website" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Creatour", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  title: { default: "Creatour", template: "%s · Creatour" },
  description: "Compare travel creators' itineraries and see where they agree.",
};

// GoatCounter site code (the "xyz" in xyz.goatcounter.com); visitor stats stay off until it is set.
const goatcounter = /^[a-z0-9-]+$/.test(process.env.GOATCOUNTER_CODE ?? "")
  ? process.env.GOATCOUNTER_CODE
  : null;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { rates } = await getRates();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      // The theme script sets data-theme before React loads.
      suppressHydrationWarning
    >
      <head>
        {/* The theme script below sets this to the chosen theme's colour. */}
        <meta name="theme-color" content="#f7f3ec" />
        {/* Paints the right page colour even before the stylesheet arrives. */}
        <style>{`html{background:#f7f3ec}html[data-theme="dark"]{background:#16120d;color-scheme:dark}`}</style>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <CurrencyProvider rates={rates}>
          <header className="border-b border-line print:hidden">
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
              <Link href="/" className="group flex shrink-0 items-center gap-2">
                <Compass
                  className="size-6 text-accent-2 transition-transform group-hover:rotate-45"
                  strokeWidth={2.2}
                  aria-hidden
                />
                <span className="font-display text-xl font-semibold tracking-tight">
                  Crea<span className="text-accent italic">tour</span>
                </span>
              </Link>
              <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-foreground/75 sm:gap-4">
                <Link
                  href="/#destinations"
                  className="hidden hover:text-accent md:inline"
                >
                  Destinations
                </Link>
                <Link
                  href="/creators"
                  className="hidden hover:text-accent lg:inline"
                >
                  Creators
                </Link>
                <Link
                  href="/itineraries"
                  className="hidden hover:text-accent sm:inline"
                >
                  Find a trip
                </Link>
                <Link
                  href="/visa"
                  className="hidden hover:text-accent lg:inline"
                >
                  Visa check
                </Link>
                <Link
                  href="/#plan"
                  aria-label="Search trips, places and creators"
                  className="hidden size-8 items-center justify-center rounded-full hover:bg-line hover:text-foreground sm:flex"
                >
                  <Search className="size-4" aria-hidden />
                </Link>
                <ThemeToggle />
                <CurrencyPicker />
                <span className="hidden gap-2 sm:inline-flex">
                  <CartLink />
                </span>
                <AccountButton enabled={googleLoginEnabled()} />
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-10 print:py-0">
            {/* Pages are prerendered whole; this only shows if a page has to load its data at request time, which
                otherwise fails with a blocking-route error. */}
            <Suspense fallback={<p className="text-muted">Loading…</p>}>
              {children}
            </Suspense>
          </main>
          <footer className="mt-8 border-t border-line print:hidden">
            <div className="mx-auto max-w-7xl px-4 pt-6">
              <div className="flex items-end justify-between gap-6">
                <div className="max-w-md flex-1">
                  <p className="font-display text-xl font-semibold">
                    Wish you were here
                  </p>
                  <EmailSignup
                    label="New destinations and creator itineraries, by email"
                    button="Sign up"
                  />
                </div>
              </div>
            </div>
            <p className="fine-print mx-auto max-w-7xl px-4 py-6">
              Featured creators are independent and not affiliated with
              Creatour; being featured doesn&apos;t mean they endorse it.
              Creator names, photos, logos and itineraries belong to their
              owners. Please visit and support them.{" "}
              <Link href="/disclosure" className="underline">
                Credits
              </Link>
              {" · "}
              <Link href="/creators" className="underline">
                Creators
              </Link>
              {" · "}
              <Link href="/visa" className="underline">
                Visa check
              </Link>
              {" · "}
              <Link href="/blog" className="underline">
                Blog
              </Link>
              {" · "}
              <Link href="/about" className="underline">
                About
              </Link>
              {" · "}
              <Link href="/contact" className="underline">
                Contact
              </Link>
              {" · "}
              <Link href="/privacy" className="underline">
                Privacy
              </Link>
              {" · "}
              <Link href="/terms" className="underline">
                Terms
              </Link>
            </p>
            <p className="mx-auto max-w-7xl px-4 pb-24 text-xs text-muted sm:pb-6">
              <InstallApp />
            </p>
          </footer>
          <Suspense fallback={null}>
            <MobileNav accounts={googleLoginEnabled()} />
            {googleLoginEnabled() && <CartSync />}
            {goatcounter && <VisitorStats code={goatcounter} />}
          </Suspense>
        </CurrencyProvider>
      </body>
    </html>
  );
}

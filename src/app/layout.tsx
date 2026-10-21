import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Compass } from "lucide-react";
import { CartLink } from "@/components/cart-link";
import { CurrencyPicker, CurrencyProvider } from "@/components/money";
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

export const metadata: Metadata = {
  title: { default: "RoamConsensus", template: "%s · RoamConsensus" },
  description: "Compare travel creators' itineraries and see where they agree.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { rates } = await getRates();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <CurrencyProvider rates={rates}>
          <header className="border-b border-line">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Compass className="size-5 text-accent" aria-hidden />
                RoamConsensus
              </Link>
              <div className="flex items-center gap-5 text-sm text-muted">
                <Link href="/#destinations" className="hidden hover:text-foreground sm:inline">
                  Destinations
                </Link>
                <Link href="/disclosure" className="hidden hover:text-foreground sm:inline">
                  Disclosure
                </Link>
                <CurrencyPicker />
                <CartLink />
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
          <footer className="border-t border-line">
            <p className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted">
              Some links are affiliate links: we may earn a commission at no extra cost to you. RoamConsensus is not
              affiliated with the creators featured.{" "}
              <Link href="/disclosure" className="underline">
                Full disclosure
              </Link>
              .
            </p>
          </footer>
        </CurrencyProvider>
      </body>
    </html>
  );
}

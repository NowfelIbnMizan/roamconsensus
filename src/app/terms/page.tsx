import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal";
import { CONTACT_EMAIL, mailto } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The rules for using Creatour: prices are estimates, check before you book, and creators own their work.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="23 October 2026">
      <p>By using Creatour you agree to these terms. They&apos;re short, so please read them.</p>

      <h2>Planning help, not travel advice</h2>
      <p>
        Creatour gathers itineraries published by travel creators so you can compare them in one place. It is for
        inspiration and planning only. We are not a travel agent and you don&apos;t book anything with us.
      </p>

      <h2>Check before you go</h2>
      <ul>
        <li>
          Prices, opening hours, visa rules, entry forms and eSIM plans change often. Everything on the site is an
          estimate from when we last checked, and currency conversions are approximate.
        </li>
        <li>
          Always confirm details with the business, airline or official government source before you book or travel.
        </li>
        <li>Your safety, health, insurance and travel documents are your own responsibility.</li>
      </ul>

      <h2>Bookings with other companies</h2>
      <p>
        When you book through a link on Creatour, your contract is with that company (for example a hotel, tour operator
        or eSIM provider). Their terms, prices and refund rules apply, and we can&apos;t help with problems with those
        bookings. How the site makes money is on the{" "}
        <Link href="/disclosure" className="underline">
          disclosure and credits
        </Link>
        .
      </p>

      <h2>Creators&apos; content</h2>
      <p>
        Itineraries, tips, names, photos and logos belong to the creators who made them. We summarise and link to their
        original posts. The creators are independent: they are not affiliated with Creatour, and being featured does
        not mean they endorse it. Creators can ask us to correct or remove their content on our{" "}
        <Link href="/contact" className="underline">
          contact page
        </Link>
        .
      </p>

      <h2>Using the site</h2>
      <p>
        You&apos;re welcome to use Creatour for your own trips and to share links to it. Please don&apos;t copy the
        site&apos;s content in bulk, scrape it, or try to break or overload it.
      </p>

      <h2>Limits</h2>
      <p>
        The site is provided as it is. As far as the law allows, we aren&apos;t liable for losses from using it,
        including from out-of-date information or bookings made with other companies. Nothing here limits rights you
        have by law as a consumer.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms and will change the date at the top when we do. Questions:{" "}
        <a href={mailto("Terms question")} className="underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </LegalPage>
  );
}

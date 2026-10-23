import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { CONTACT_EMAIL, mailto } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Creatour: questions, corrections, creator requests and partnerships.",
};

const reasons = [
  {
    title: "Spotted a mistake?",
    text: "A closed place, a wrong price or a broken link. Tell us the page and what's changed and we'll fix it.",
    subject: "Correction",
  },
  {
    title: "Are you a featured creator?",
    text: "Ask us to correct your itinerary, use your own booking links for your picks, or remove your content. We act on these first.",
    subject: "Creator request",
  },
  {
    title: "Your data",
    text: "Ask what we hold about you, or to delete your email from our list. See the privacy policy for what we keep.",
    subject: "Privacy request",
  },
  {
    title: "Partnerships",
    text: "Tourism boards, hotels, tour operators and affiliate programs.",
    subject: "Partnership",
  },
];

export default function ContactPage() {
  return (
    <article className="max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-3">One inbox for everything. We read every email and usually reply within a few days.</p>
      <p className="mt-5">
        <a href={mailto()} className="inline-flex items-center gap-2 text-lg font-medium text-accent underline">
          <Mail className="size-5" aria-hidden /> {CONTACT_EMAIL}
        </a>
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {reasons.map((r) => (
          <li key={r.title} className="rounded-sm border border-line bg-card p-4">
            <h2 className="font-semibold">{r.title}</h2>
            <p className="mt-1 text-sm text-muted">{r.text}</p>
            <a href={mailto(r.subject)} className="mt-3 inline-block text-sm font-medium text-accent underline">
              Email us
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-muted">
        Creatour is not affiliated with the creators featured. See also{" "}
        <Link href="/about" className="underline">
          about
        </Link>
        ,{" "}
        <Link href="/privacy" className="underline">
          privacy
        </Link>
        ,{" "}
        <Link href="/terms" className="underline">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/disclosure" className="underline">
          affiliate disclosure
        </Link>
        .
      </p>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Coins, PiggyBank, Receipt, Scale, UserPlus, Users } from "lucide-react";
import { FaqList } from "@/components/faq-list";
import type { Faq } from "@/lib/faq";

export const metadata: Metadata = {
  alternates: { canonical: "/split-travel-costs" },
  title: "Split travel costs with friends, free",
  description:
    "Log who paid what on a group trip, in any currency, and see the fewest payments to settle up. Free, in your browser, and friends don't need to sign up.",
};

const steps = [
  { icon: Users, title: "Start a group trip", text: "Sign in once with Google and name the trip." },
  { icon: UserPlus, title: "Add your friends", text: "Share the invite link, or just type a friend's name." },
  { icon: Receipt, title: "Log costs as you go", text: "Who paid, how much, and who it's split between." },
];

const features = [
  { icon: Coins, title: "Any currency", text: "Pay in baht, yen or rupiah. Balances show in your own currency." },
  { icon: Scale, title: "Fewest payments", text: "Settle up in as few transfers as possible, then tap Mark paid." },
  { icon: UserPlus, title: "No sign-up wall", text: "Friends without an account are added by name and still count." },
  { icon: PiggyBank, title: "Budget vs spent", text: "Set a shared budget and watch the bar fill as costs come in." },
];

// An illustration of the settle-up view; the names and amounts are made up.
const example = [
  { from: "Sam", to: "Maya", amount: "$84" },
  { from: "Leo", to: "Maya", amount: "$31" },
];

const faq: Faq[] = [
  {
    q: "Is it free?",
    a: "Yes. Splitting costs is part of group trips on Creatour, which is free. There is no paid plan.",
  },
  {
    q: "Does everyone need an account?",
    a: "No. The person who starts the group trip signs in with Google. Friends can join with the invite link, or be added by name as guests who never sign up. Anyone in the trip can log costs for a guest.",
  },
  {
    q: "Can we pay in different currencies?",
    a: "Yes. Log each cost in the currency you paid in. Balances and the settle-up list convert to your own currency at today's rate.",
  },
  {
    q: "Does money move through Creatour?",
    a: "No. Creatour only keeps the tally. You pay each other back however you like, then tap Mark paid so the balances update.",
  },
  {
    q: "How is the settle-up worked out?",
    a: "Each person's balance is what they paid minus their share. The biggest debt is matched with the biggest credit, and so on, which keeps the number of payments low.",
  },
  {
    q: "Can I split a cost unevenly?",
    a: "Yes. Tick who it's split between, or switch on different amounts each and type each person's part. The form checks the parts add up.",
  },
];

export default function SplitCostsPage() {
  return (
    <>
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow">Group trips</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Split travel costs with friends
          </h1>
          <p className="mt-3 max-w-xl text-lg text-muted">
            Who paid what, in any currency, and the fewest payments to settle up. Free, in your browser. Friends don&apos;t
            need to sign up.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/my-trips#groups"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-medium text-background"
            >
              Start a group trip <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/itineraries" className="text-sm underline">
              Or find a route first
            </Link>
          </div>
        </div>

        <figure className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5" aria-label="Example settle-up">
          <p className="flex items-center gap-2 font-semibold">
            <Receipt className="size-4 text-accent" aria-hidden /> Split costs
          </p>
          <p className="mt-3 text-sm">
            <b>$1,240</b> spent of $1,500
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full w-[83%] rounded-full bg-accent" />
          </div>
          <p className="mt-4 text-lg font-semibold">You&apos;re owed $115</p>
          <ul className="mt-2 grid gap-2">
            {example.map((t) => (
              <li key={t.from} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <span className="font-medium">{t.from}</span>
                {t.from === "Leo" && <span className="text-xs text-muted">(guest)</span>}
                <ArrowRight className="size-4 text-muted" aria-hidden />
                <span className="font-medium">{t.to === "Maya" ? "You" : t.to}</span>
                <span className="ml-auto tabular-nums">{t.amount}</span>
              </li>
            ))}
          </ul>
          <figcaption className="fine-print mt-3">Example. Names and amounts are made up.</figcaption>
        </figure>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-card p-4">
              <p className="flex items-center gap-2 font-medium">
                <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-sm text-accent">
                  {i + 1}
                </span>
                {s.title}
              </p>
              <p className="mt-1.5 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Made for trips</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <li key={f.title} className="rounded-2xl border border-line p-4">
              <f.icon className="size-5 text-accent" aria-hidden />
              <p className="mt-2 font-medium">{f.title}</p>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          It sits next to the plan: vote on stops together, and log what a stop cost with one tap.
        </p>
      </section>

      <FaqList title="Questions" faq={faq} />

      <section className="mt-12 rounded-2xl border border-line bg-card p-6 text-center">
        <p className="text-lg font-semibold">Going away with friends?</p>
        <Link
          href="/my-trips#groups"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-medium text-background"
        >
          Start a group trip <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </>
  );
}

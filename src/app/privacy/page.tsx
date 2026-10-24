import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal";
import { CONTACT_EMAIL, mailto } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What Creatour collects, why, and how to have it deleted. Short version: very little, and no tracking cookies.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="23 October 2026">
      <p>
        <strong>Short version:</strong> you don&apos;t need an account, we set no tracking cookies, your trip cart stays
        on your own device unless you sign in, and we only keep your email address if you give it to us.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Your trip cart, day plan, chosen currency, passport (on the visa checker), theme, ticked checklists and hidden
        tips are saved in your browser&apos;s local storage. Unless you sign in, they never reach us. Clearing your
        browser data removes them.
      </p>
      <p>
        When you use <em>Share my trip</em>, the plan is packed into the link itself. Whoever you send the link to can
        see it; we don&apos;t store it.
      </p>

      <h2>If you sign in with Google</h2>
      <p>
        Signing in is optional. When you do, Google tells us your name, email address and profile photo, and we keep
        your trip cart (with any notes you add), saved trips and hearted places so they show up on all your devices. A
        sign-in cookie keeps you signed in for up to 90 days; it is only used for that. We never see your Google
        password, and we don&apos;t ask for access to your contacts, files or anything else.
      </p>
      <p>
        If you join or start a group trip, the other people in it see your first name, profile photo, the stops you
        added and your votes. Your notes stay private. If you turn on trip alerts, we email you at most once a day, and
        every alert has a link to turn them off.
      </p>
      <p>
        You can delete your account, saved trips and places any time from{" "}
        <Link href="/my-trips" className="underline">
          My trips
        </Link>
        . That removes them from our database straight away.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your email address</strong>, only if you sign up for updates or ask us to email you a trip plan. We
          keep the address, where you signed up, the last trip link you asked for, and when we last emailed you. We use
          it only to send what you asked for, never sell or share it, and every email has an unsubscribe link.
        </li>
        <li>
          <strong>Visitor statistics</strong> through{" "}
          <a href="https://www.goatcounter.com" className="underline" rel="noopener noreferrer" target="_blank">
            GoatCounter
          </a>
          : which pages are viewed, the referring site, browser, screen size and country. It uses no cookies and does
          not identify you.
        </li>
        <li>
          <strong>Server logs</strong> kept briefly by our host for security and fixing errors, such as your IP address
          and the page requested.
        </li>
      </ul>

      <h2>Services we use</h2>
      <ul>
        <li>Vercel hosts the site. Neon stores our database, including the email list and accounts.</li>
        <li>Google handles signing in, if you choose to.</li>
        <li>Resend sends emails, when you ask for one.</li>
        <li>OpenStreetMap supplies map tiles, so your browser loads them from their servers when you view a map.</li>
        <li>YouTube videos load only when you press play, using YouTube&apos;s privacy-enhanced mode.</li>
        <li>Photos come from Unsplash and Pexels, served through our own site.</li>
      </ul>

      <h2>Links to other sites</h2>
      <p>
        Booking, tour, eSIM and creator links take you to other websites. Once you leave Creatour, that site&apos;s
        privacy policy applies.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete the data we hold about you at any time by emailing{" "}
        <a href={mailto("Privacy request")} className="underline">
          {CONTACT_EMAIL}
        </a>
        . To stop emails, use the unsubscribe link in any email we send. If you&apos;re in the UK or EU, you can also
        complain to your data protection authority.
      </p>

      <h2>Children</h2>
      <p>Creatour is meant for adults planning trips. We don&apos;t knowingly collect data from children under 16.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we&apos;ll update the date at the top of this page.</p>
    </LegalPage>
  );
}

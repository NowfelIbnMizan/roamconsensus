import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Credits",
  description: "Who owns the content on Creatour and how creators are credited.",
};

export default function DisclosurePage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Credits</h1>

      <h2 id="credits" className="scroll-mt-6 pt-2 text-xl font-semibold">
        Creators are independent
      </h2>
      <p>
        The travel creators featured on Creatour are independent. They are not affiliated with, sponsored by or
        partnered with Creatour. Being featured here does not mean a creator endorses Creatour, and it does not mean
        Creatour endorses everything they publish.
      </p>
      <p>
        Creator names, photos, logos, trademarks and itineraries belong to their respective owners. Creatour shows a
        short summary of each route, credits the creator by name and links to the original guide and their own
        channels.
      </p>
      <p>
        <strong>Please support them.</strong> The full guides have the stories, photos and detail that a summary
        leaves out. Read the originals, follow the creators and share their work.
      </p>
      <p>
        Are you a featured creator? You can ask for a correction, a different photo or link, or for your content to
        be removed, and it will be handled quickly.{" "}
        <Link href="/contact" className="underline">
          Contact us
        </Link>
        .
      </p>

      <h2 className="pt-2 text-xl font-semibold">Photos of places</h2>
      <p>
        Place photos come from Unsplash and Pexels (credited to the photographer) or from the venue&apos;s own
        website. They belong to their owners.
      </p>
    </article>
  );
}

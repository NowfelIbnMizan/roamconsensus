"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { authClient, signInWithGoogle } from "@/lib/auth-client";

export function Avatar({
  name,
  image,
  className = "size-8",
}: {
  name: string;
  image?: string | null;
  className?: string;
}) {
  return image ? (
    // Google's profile photos refuse requests that carry another site's referrer; a 32px avatar needs no resizing.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" referrerPolicy="no-referrer" className={`${className} rounded-full object-cover`} />
  ) : (
    <span
      aria-hidden
      className={`${className} flex items-center justify-center rounded-full bg-accent font-semibold text-background`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Header sign-in button, or the traveller's photo linking to My trips. Hidden until Google keys are set. */
export function AccountButton({ enabled }: { enabled: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  if (!enabled) return null;
  if (isPending) return <span className="size-8" aria-hidden />;
  if (session)
    return (
      <Link href="/my-trips" aria-label={`My trips (signed in as ${session.user.name})`} className="rounded-full">
        <Avatar name={session.user.name} image={session.user.image} />
      </Link>
    );
  return (
    <button
      type="button"
      onClick={() => signInWithGoogle()}
      className="flex items-center gap-1.5 rounded-full border border-line px-2 py-1 hover:border-accent hover:text-accent sm:px-3"
    >
      <LogIn className="size-4" aria-hidden />
      Sign in
    </button>
  );
}

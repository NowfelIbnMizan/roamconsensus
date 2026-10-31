"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { ArrowRight, Check, X } from "lucide-react";
import { authClient, signInWithGoogle } from "@/lib/auth-client";

type Notice = { text: string; hint: boolean; at: number } | null;

const useAdded = create<{ notice: Notice }>(() => ({ notice: null }));

/** Called by the add buttons, so a first-time visitor learns where the trip went and how to get there. */
export function announceAdded(text: string) {
  // The "saved on this device" line shows the first few times only, then the toast is just the link.
  let hint = true;
  try {
    const seen = Number(localStorage.getItem(HINT_KEY) ?? 0);
    hint = seen < 3;
    localStorage.setItem(HINT_KEY, String(seen + 1));
  } catch {}
  useAdded.setState({ notice: { text, hint, at: Date.now() } });
}

const HINT_KEY = "roamconsensus-added-hint";

export function AddedToast({ accounts }: { accounts: boolean }) {
  const notice = useAdded((s) => s.notice);
  const pathname = usePathname();
  const [hold, setHold] = useState(false);
  const hint = notice?.hint ?? false;

  useEffect(() => {
    if (!notice || hold) return;
    const t = setTimeout(() => useAdded.setState({ notice: null }), hint ? 9000 : 6000);
    return () => clearTimeout(t);
  }, [notice, hold, hint]);

  useEffect(() => useAdded.setState({ notice: null }), [pathname]);

  if (!notice || pathname.startsWith("/cart")) return null;

  return (
    <div
      role="status"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
      className="fixed inset-x-3 bottom-20 z-[1200] mx-auto max-w-md rounded-2xl border border-line-strong bg-card p-3 shadow-lg sm:bottom-6"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-background">
          <Check className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{notice.text}</p>
          {hint && (
            <p className="mt-0.5 text-sm text-muted">
              Your trip plan is saved on this device. Open it any time from <b>Trip plan</b>
              <span className="sm:hidden"> in the Trip tab below</span>
              <span className="hidden sm:inline"> at the top of the page</span>.
              {accounts && <SignInHint />}
            </p>
          )}
          <Link
            href="/cart"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Go to trip plan <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => useAdded.setState({ notice: null })}
          aria-label="Close"
          className="-m-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-accent-soft"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** Signed-out travellers learn an account keeps the trip on every device; signed-in ones already have that. */
function SignInHint() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending || session) return null;
  return (
    <>
      {" "}
      <button type="button" onClick={() => signInWithGoogle()} className="font-medium text-accent underline">
        Sign in
      </button>{" "}
      to keep it on all your devices.
    </>
  );
}

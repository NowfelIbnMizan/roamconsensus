"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** A discount code people can copy in one tap before they open the booking site. */
export function CouponCode({ code, note }: { code: string; note?: string | null }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
      title={note ?? "Copy the code, then paste it at checkout"}
      className="inline-flex items-center gap-1 rounded border border-dashed border-accent px-1.5 py-0.5 font-mono text-accent hover:bg-accent-soft"
    >
      {code}
      {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
      <span className="sr-only">{copied ? "Copied" : "Copy code"}</span>
    </button>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Money } from "@/components/money";

export function FromPrice({ p }: { p: { cents: number; unit: string | null; currency: string } }) {
  if (p.cents === 0) return "Free";
  return (
    <>
      from <Money cents={p.cents} currency={p.currency} />
      {p.unit && `/${p.unit}`}
    </>
  );
}

export function MiniCard({
  eyebrow,
  name,
  fromPrice,
  blurb,
  tip,
  picked,
  href,
}: {
  eyebrow: string;
  name: string;
  fromPrice: { cents: number; unit: string | null; currency: string } | null;
  blurb: string | null;
  tip: string | null;
  picked: string | null;
  href: string;
}) {
  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <p className="eyebrow">{eyebrow}</p>
      <p className="mt-1 font-display text-lg font-semibold leading-snug">{name}</p>
      {fromPrice && (
        <p className="text-sm text-muted tabular-nums">
          <FromPrice p={fromPrice} />
        </p>
      )}
      {blurb && <p className="mt-2 text-sm">{blurb}</p>}
      {tip && (
        <p className="mt-2 text-sm text-muted">
          <span className="font-medium text-foreground">Tip:</span> {tip}
        </p>
      )}
      {picked && <p className="mt-3 text-xs text-muted">{picked}</p>}
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        Open place <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

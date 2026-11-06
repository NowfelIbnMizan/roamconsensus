import { ChevronDown } from "lucide-react";
import { checkedLabel, scopeWords, type PriceScope } from "@/lib/price-scope";

/** One line under a card's total: "Estimate · 12 of 15 stops priced", with what it covers on hover. */
export function PriceScopeLine({ scope, className = "" }: { scope: PriceScope; className?: string }) {
  const words = scopeWords(scope);
  return (
    <span
      className={`block text-xs text-muted ${className}`}
      title={`${words.covers ? `Covers ${words.covers}. ` : ""}Leaves out ${words.leavesOut}.`}
    >
      Estimate · {scope.priced} of {scope.stops} {scope.stops === 1 ? "stop" : "stops"} priced
    </span>
  );
}

/** Covers / leaves out, as one short line for route cards. */
export function PriceScopeCovers({ scope, className = "" }: { scope: PriceScope; className?: string }) {
  const words = scopeWords(scope);
  return (
    <span className={`block text-xs text-muted ${className}`}>
      {words.covers ? `Covers ${words.covers}. ` : ""}No flights.
    </span>
  );
}

/** "What's in this price?" fold beside a route's total: estimate, covers, leaves out, priced count, last check. */
export function PriceScopeFold({ scope, className = "" }: { scope: PriceScope; className?: string }) {
  const words = scopeWords(scope);
  return (
    <details className={`group ${className}`}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm text-muted underline decoration-dotted hover:text-foreground [&::-webkit-details-marker]:hidden">
        What&apos;s in this price?
        <ChevronDown className="size-3.5 transition group-open:rotate-180" aria-hidden />
      </summary>
      <dl className="mt-2 grid max-w-md grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-2xl border border-line bg-card p-4 text-sm">
        <dt className="text-muted">Type</dt>
        <dd>Estimate per person, not a quote</dd>
        {words.covers && (
          <>
            <dt className="text-muted">Covers</dt>
            <dd>{words.covers}</dd>
          </>
        )}
        <dt className="text-muted">Leaves out</dt>
        <dd>{words.leavesOut}, and any stop without a price</dd>
        <dt className="text-muted">Priced</dt>
        <dd>
          {scope.priced} of {scope.stops} {scope.stops === 1 ? "stop" : "stops"}
        </dd>
        <dt className="text-muted">Checked</dt>
        <dd>
          {scope.checkedAt
            ? `Researched prices checked ${checkedLabel(scope.checkedAt)}. The rest are the creator's own.`
            : "Prices are the creator's own, from their guide."}
        </dd>
      </dl>
    </details>
  );
}

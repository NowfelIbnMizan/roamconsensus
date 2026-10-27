import { ChevronDown, CircleCheck } from "lucide-react";
import { CreatorChip } from "@/components/creator";

type Creator = Parameters<typeof CreatorChip>[0]["creator"];

/**
 * "3 of 4 creators agree": one tap opens the names. Keeps place lists short; the who is there for anyone who asks.
 * A creator who says skip it shows in the summary too, since that changes the decision.
 */
export function AgreePill({
  creators,
  total,
  skippedBy = [],
  className = "",
}: {
  creators: Creator[];
  total: number;
  skippedBy?: Creator[];
  className?: string;
}) {
  if (!creators.length && !skippedBy.length) return null;
  const all = total > 1 && creators.length === total;
  // Phones drop "Picked by" so the pill fits one line in the two-column grid; the section heading says it already.
  const label =
    total <= 1 ? (
      `Picked by ${creators[0]?.name ?? "a creator"}`
    ) : (
      <>
        <span className="hidden sm:inline">Picked by </span>
        {all ? `all ${total}` : `${creators.length} of ${total}`} creators
      </>
    );
  return (
    <details className={`group ${className}`}>
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-1 py-1 text-xs font-medium hover:underline [&::-webkit-details-marker]:hidden ${
          all ? "text-accent" : "text-foreground/75"
        }`}
      >
        {creators.length > 0 && (
          <CircleCheck className="size-3.5" aria-hidden />
        )}
        {creators.length > 0 ? label : null}
        {skippedBy.length > 0 && (
          <span className="text-red-700 dark:text-red-400">
            {creators.length > 0 && "· "}
            {skippedBy.length} {skippedBy.length === 1 ? "says" : "say"} skip
          </span>
        )}
        <ChevronDown
          className="size-3.5 transition group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {creators.map((c) => (
          <CreatorChip key={c.handle} creator={c} />
        ))}
        {skippedBy.length > 0 && (
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-red-700 dark:text-red-400">
            {skippedBy.map((c) => (
              <CreatorChip key={c.handle} creator={c} />
            ))}
            says skip it
          </span>
        )}
      </div>
    </details>
  );
}

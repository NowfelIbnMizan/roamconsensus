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
  const label =
    total <= 1
      ? `Picked by ${creators[0]?.name ?? "a creator"}`
      : all
        ? `All ${total} creators agree`
        : `${creators.length} of ${total} creators agree`;
  return (
    <details className={`group ${className}`}>
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium [&::-webkit-details-marker]:hidden ${
          all ? "bg-accent-soft text-accent" : "bg-line text-foreground/80"
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

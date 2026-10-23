import { creatorTint } from "@/lib/creator-links";

/** A creator's initial in their own colour, big enough to anchor a profile card. */
export function CreatorAvatar({
  creator,
  size = "md",
  className = "",
}: {
  creator: { handle: string; name: string };
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = { sm: "size-9 text-sm", md: "size-12 text-lg", lg: "size-16 text-2xl" }[size];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ${box} ${creatorTint(creator.handle)} ${className}`}
    >
      {creator.name.charAt(0)}
    </span>
  );
}

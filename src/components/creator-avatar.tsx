import { creatorTint } from "@/lib/creator-links";

/** A creator's initial in their own colour, big enough to anchor a profile card. */
export function CreatorAvatar({ creator, size = "md" }: { creator: { handle: string; name: string }; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-16 text-2xl" : "size-12 text-lg";
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ${box} ${creatorTint(creator.handle)}`}
    >
      {creator.name.charAt(0)}
    </span>
  );
}

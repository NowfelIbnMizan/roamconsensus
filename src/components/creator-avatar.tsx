import { AvatarImage } from "@/components/avatar-image";
import { creatorTint } from "@/lib/creator-links";

/**
 * A creator's photo when they've agreed to one (Admin > Creators > Avatar photo), else their initial in their own
 * colour, big enough to anchor a profile card.
 */
export function CreatorAvatar({
  creator,
  size = "md",
  className = "",
}: {
  creator: { handle: string; name: string; avatarUrl?: string | null; hideAvatar?: boolean };
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = { sm: "size-9 text-sm", md: "size-12 text-lg", lg: "size-16 text-2xl" }[size];
  const initial = (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ${box} ${creatorTint(creator.handle)} ${className}`}
    >
      {creator.name.charAt(0)}
    </span>
  );
  if (!creator.avatarUrl || creator.hideAvatar) return initial;
  return (
    <span aria-hidden className={`relative block shrink-0 overflow-hidden rounded-full bg-line ${box} ${className}`}>
      <AvatarImage src={creator.avatarUrl} alt={creator.name} sizes="64px" fallback={initial} />
    </span>
  );
}

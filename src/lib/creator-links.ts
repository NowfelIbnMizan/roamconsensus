/** Social profile fields on Creator, in the order their buttons show. */
export const SOCIALS = [
  { key: "instagramUrl", label: "Instagram", tint: "bg-pink-500/15 text-pink-800 dark:text-pink-300" },
  { key: "tiktokUrl", label: "TikTok", tint: "bg-neutral-500/15 text-foreground" },
  { key: "youtubeUrl", label: "YouTube", tint: "bg-red-500/15 text-red-800 dark:text-red-300" },
  { key: "facebookUrl", label: "Facebook", tint: "bg-blue-500/15 text-blue-800 dark:text-blue-300" },
  { key: "xUrl", label: "X", tint: "bg-neutral-500/15 text-foreground" },
  { key: "pinterestUrl", label: "Pinterest", tint: "bg-rose-500/15 text-rose-800 dark:text-rose-300" },
  { key: "websiteUrl", label: "Website", tint: "bg-accent-soft text-accent" },
] as const;

export type SocialKey = (typeof SOCIALS)[number]["key"];
export type CreatorLinks = { [K in SocialKey]?: string | null };

/** Prisma select for everything the creator buttons need. */
export const creatorLinkSelect = {
  handle: true,
  name: true,
  profileUrl: true,
  avatarUrl: true,
  hideAvatar: true,
  bio: true,
  ...Object.fromEntries(SOCIALS.map((s) => [s.key, true])),
} as { handle: true; name: true; profileUrl: true; avatarUrl: true; hideAvatar: true; bio: true } & { [K in SocialKey]: true };

// Each creator keeps one colour everywhere, so two names side by side read as two people.
const TINTS = [
  "bg-violet-500/15 text-violet-800 dark:text-violet-300 ring-violet-500/30",
  "bg-amber-500/15 text-amber-800 dark:text-amber-300 ring-amber-500/30",
  "bg-sky-500/15 text-sky-800 dark:text-sky-300 ring-sky-500/30",
  "bg-rose-500/15 text-rose-800 dark:text-rose-300 ring-rose-500/30",
  "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-emerald-500/30",
  "bg-orange-500/15 text-orange-800 dark:text-orange-300 ring-orange-500/30",
];

export function creatorTint(handle: string) {
  let h = 0;
  for (const ch of handle) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

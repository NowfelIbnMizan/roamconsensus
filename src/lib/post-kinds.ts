import type { PostKind } from "@/generated/prisma/enums";

/** Admin wording for each post type, and the questions that help the owner write it in his own words. */
export const POST_KINDS: Record<PostKind, { label: string; hint: string; questions: string[] }> = {
  GENERAL: {
    label: "General post",
    hint: "A plain post: tips, news, anything.",
    questions: [],
  },
  TAKE: {
    label: "My take on a route",
    hint: "Pick a route. The post shows its card, days and cost above your words.",
    questions: [
      "Who is this route for?",
      "What would you keep exactly as it is?",
      "What would you skip or swap?",
      "Is it worth the money?",
      "One tip the creator didn't mention",
    ],
  },
  COMPARE: {
    label: "Side by side",
    hint: "Pick two routes in the same city. The post shows a table of both and the places they share.",
    questions: [
      "Why compare these two?",
      "Where they agree",
      "Where they differ",
      "Which one would you pick, and for whom?",
    ],
  },
  TRIP: {
    label: "My own trip",
    hint: "Your own trip. Use a ## Day 1 heading for each day so readers can follow it.",
    questions: ["Who I went with and when", "## Day 1", "## Day 2", "What I'd do differently", "What it cost"],
  },
};

/** The label readers see above the title; null for a general post. */
export function kindEyebrow(kind: PostKind, editorName: string) {
  const first = editorName.split(" ")[0];
  return kind === "TAKE"
    ? `${first}'s take`
    : kind === "COMPARE"
      ? "Side by side"
      : kind === "TRIP"
        ? `${first}'s trip`
        : null;
}

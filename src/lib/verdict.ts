/** A place gets a "worth it?" answer only when this many creators weigh in on it; fewer is one or two opinions, not a verdict. */
export const VERDICT_MIN = 3;

/** Titles get " · Creatour" added; past this length search results cut them. */
const TITLE_MAX = 58;

type Counts = {
  name: string;
  city: string;
  /** Creators who include the place in a route. */
  agree: number;
  /** Creators who say to skip it. */
  avoid: number;
  /** Creators with a route in the city. */
  creators: number;
};

/**
 * "Is X worth it?" answered with counts only: how many of a city's creators include the place, and how many say to
 * skip it. Never an opinion of ours. Null when too few creators weigh in.
 */
export function placeVerdict({ name, city, agree, avoid, creators }: Counts) {
  // Creators who say "skip it" are part of the answer too: two who go and two who warn is worth telling.
  if (agree < 1 || agree + avoid < VERDICT_MIN || creators < VERDICT_MIN) return null;
  const short = name.replace(/\s*\(.*\)$/, "");
  const count = agree === creators ? `All ${creators} creators` : `${agree} of ${creators} creators`;
  const most = agree * 2 >= creators;
  const lead = agree === creators ? "Yes." : most ? "Most creators say yes." : "It splits creators.";
  const rest = creators - agree;
  const skips =
    avoid === 0
      ? ""
      : rest === 1
        ? "The other one says to skip it."
        : `${avoid === 1 ? "One" : avoid} of the other ${rest} ${avoid === 1 ? "says" : "say"} to skip it.`;
  const answer = [
    `${lead} ${count} with a ${city} route include it${rest > 0 && !most ? `; the other ${rest} leave it out` : ""}.`,
    skips,
  ]
    .filter(Boolean)
    .join(" ");
  const tally = agree === creators ? `all ${creators} creators go` : `${agree} of ${creators} creators go`;
  const title =
    [`Is ${name} worth it? ${tally}`, `Is ${short} worth it? ${tally}`, `Is ${short} worth it? What creators say`].find(
      (t) => t.length <= TITLE_MAX,
    ) ?? null;
  return {
    question: `Is ${short} worth it?`,
    answer,
    /** Null when even the short form is too long for a search result; the page keeps its plain title. */
    title,
    description: `${count} with a ${city} route include ${short}. See what each one says, the price, tips and what's nearby.`,
  };
}

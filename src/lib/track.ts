// Planning-step counts through GoatCounter events: no cookies, nothing tied to a person, just "how many visitors got
// this far". Shows in Admin > Visitors as the planning funnel. Does nothing when GoatCounter isn't set up.

/** The steps from browsing to a usable plan, in funnel order. Names are what GoatCounter lists. */
export const FUNNEL = [
  { event: "stop-added", label: "Added a stop" },
  { event: "route-added", label: "Added a whole route" },
  { event: "plan-ready", label: "Opened a trip plan with 3+ stops" },
  { event: "trip-shared", label: "Shared a trip" },
  { event: "trip-exported", label: "Exported (calendar, print, checklist)" },
  { event: "trip-saved", label: "Saved a trip to their account" },
] as const;

export type FunnelEvent = (typeof FUNNEL)[number]["event"];

/** Count one step. With once, at most once per browser tab session, so reloads don't inflate it. */
export function track(event: FunnelEvent, { once = false } = {}) {
  if (typeof window === "undefined") return;
  if (once) {
    try {
      const key = `roamconsensus-tracked-${event}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: count anyway.
    }
  }
  window.goatcounter?.count({
    path: event,
    title: FUNNEL.find((f) => f.event === event)?.label ?? event,
    event: true,
  });
}

/** Trip-length buckets shared by the home planner and the trip finder (?length= is an index into this list). */
export const LENGTHS = [
  { label: "Any length", min: 0, max: Infinity },
  { label: "1–3 days", min: 1, max: 3 },
  { label: "4–7 days", min: 4, max: 7 },
  { label: "8–14 days", min: 8, max: 14 },
  { label: "15+ days", min: 15, max: Infinity },
];

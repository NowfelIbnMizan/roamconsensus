/** Brand-tinted pill for a booking site; pay-on-site groups get a neutral one. */
const tints: Record<string, string> = {
  Klook: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
  GetYourGuide: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  Agoda: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  "Booking.com": "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  SafetyWing: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  Marriott: "bg-stone-500/15 text-stone-700 dark:text-stone-300",
  "12Go": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  Amazon: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

export function VendorBadge({ name, bookable }: { name: string; bookable: boolean }) {
  const tint = bookable ? (tints[name] ?? "bg-accent-soft text-accent") : "bg-line text-muted";
  return <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${tint}`}>{name}</span>;
}

/** "Updated 23 Oct 2026": fresh dates help search engines and readers trust the page. */
export function UpdatedOn({ date, className = "mt-8 block text-xs" }: { date: string; className?: string }) {
  const label = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
  return (
    <span className={`text-muted ${className}`}>
      Updated <time dateTime={date}>{label}</time>
    </span>
  );
}

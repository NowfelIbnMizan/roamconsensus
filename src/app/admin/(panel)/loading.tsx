/** Shows straight away when switching admin pages, while the page loads its data. */
export default function AdminLoading() {
  return (
    <div
      className="animate-pulse space-y-3"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="h-7 w-48 rounded bg-line" />
      <div className="h-4 w-72 rounded bg-line" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-12 rounded-xl bg-line" />
        ))}
      </div>
    </div>
  );
}

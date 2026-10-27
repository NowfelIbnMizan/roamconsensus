import { FlaskConical } from "lucide-react";

export function SampleBanner() {
  return (
    <p className="mb-6 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
      Sample data: these creators are fictional and prices are illustrative. Real routes are on the way.
    </p>
  );
}

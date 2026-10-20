import { categoryLabel } from "@/lib/format";
import type { ItemCategory } from "@/generated/prisma/enums";

const colors: Record<ItemCategory, string> = {
  STAY: "bg-teal-600",
  EXPERIENCE: "bg-amber-500",
  FOOD: "bg-rose-500",
  ESIM: "bg-sky-500",
  GEAR: "bg-violet-500",
  TRANSIT: "bg-stone-500",
};

export function AllocationBar({ allocation }: { allocation: { category: ItemCategory; pct: number }[] }) {
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-line">
        {allocation.map((a) => (
          <div key={a.category} className={colors[a.category]} style={{ width: `${a.pct}%` }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {allocation.map((a) => (
          <li key={a.category} className="flex items-center gap-1">
            <span className={`size-2 rounded-full ${colors[a.category]}`} />
            {categoryLabel[a.category]} {Math.round(a.pct)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

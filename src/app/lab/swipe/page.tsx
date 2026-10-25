import { categoryLabel } from "@/lib/format";
import { bali, SwipeCard } from "../shared";

export default async function Swipe() {
  const d = await bali();
  const cats = [...new Set(d.consensus.map((p) => p.category))];
  return (
    <section>
      <h2 className="text-2xl font-semibold">What creators agree on</h2>
      {cats.map((c) => {
        const ps = d.consensus.filter((p) => p.category === c);
        return (
          <div key={c} className="mt-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">{categoryLabel[c]}</h3>
              <span className="text-sm text-accent">See all {ps.length}</span>
            </div>
            <ul className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {ps.slice(0, 8).map((p) => (
                <SwipeCard key={p.slug} d={d} p={p} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

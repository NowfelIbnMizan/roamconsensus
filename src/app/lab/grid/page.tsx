import { bali, GridCard } from "../shared";

export default async function Grid() {
  const d = await bali();
  return (
    <section>
      <h2 className="text-2xl font-semibold">What creators agree on</h2>
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {d.consensus.slice(0, 12).map((p) => (
          <GridCard key={p.slug} d={d} p={p} />
        ))}
      </ul>
    </section>
  );
}

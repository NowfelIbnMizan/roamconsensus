import { Header, load } from "../shared";
import { Picker } from "./picker";

/** B: pick by city. "Where are you going?" chips, then that city's plan as one big card. */
export default async function PickLab() {
  const lab = await load();
  return (
    <div className="mx-auto max-w-3xl">
      <Header lab={lab} />
      <h2 className="mt-8 text-lg font-semibold">Where are you going?</h2>
      <Picker trips={lab.trips} />
    </div>
  );
}

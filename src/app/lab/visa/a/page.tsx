import { getDestinations } from "@/lib/data";
import { MockA } from "../mockups";

export default async function Page() {
  const cities = (await getDestinations()).filter((d) => !d.isSample);
  return <MockA cities={cities.map(({ slug, name, country }) => ({ slug, name, country }))} />;
}

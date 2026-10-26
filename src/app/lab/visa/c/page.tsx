import { getDestinations } from "@/lib/data";
import { MockC } from "../mockups";

export default async function Page() {
  const cities = (await getDestinations()).filter((d) => !d.isSample);
  return <MockC cities={cities.map(({ slug, name, country }) => ({ slug, name, country }))} />;
}

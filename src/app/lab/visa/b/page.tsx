import { getDestinations } from "@/lib/data";
import { MockB } from "../mockups";

export default async function Page() {
  const cities = (await getDestinations()).filter((d) => !d.isSample);
  return <MockB cities={cities.map(({ slug, name, country }) => ({ slug, name, country }))} />;
}

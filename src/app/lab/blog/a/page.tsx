import { getDestinations } from "@/lib/data";
import { MockA, SAMPLE_POSTS } from "../mockups";

export default async function Page() {
  const cities = (await getDestinations())
    .filter((d) => !d.isSample)
    .map((d) => ({ slug: d.slug, name: d.name, country: d.country, heroPhotoUrl: d.heroPhotoUrl, routes: d._count.itineraries }));
  return <MockA posts={SAMPLE_POSTS} cities={cities} />;
}

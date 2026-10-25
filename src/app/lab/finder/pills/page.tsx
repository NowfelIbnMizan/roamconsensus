import { getQuizData } from "@/lib/data";
import { View } from "./view";

export default async function Page() {
  const { routes } = await getQuizData();
  return <View routes={routes} />;
}

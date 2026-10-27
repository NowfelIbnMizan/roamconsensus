import type { Metadata } from "next";
import { PageGuide } from "@/components/page-guide";
import { getQuizData } from "@/lib/data";
import { TripFinder } from "./finder";

export const metadata: Metadata = {
  title: "Find a route by length and budget",
  description:
    "Every creator itinerary on Creatour, filtered by how many days you have and what you want to spend.",
};

export default async function TripsPage() {
  const { routes } = await getQuizData();
  return (
    <TripFinder
      routes={routes}
      guide={<PageGuide id="finder" className="mt-4" />}
    />
  );
}

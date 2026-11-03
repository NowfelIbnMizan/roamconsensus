import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { PageGuide } from "@/components/page-guide";
import { getQuizData } from "@/lib/data";
import { TripFinder } from "./finder";

export const metadata: Metadata = {
  ...canonical("/itineraries"),
  title: "Find a route by length and budget",
  description:
    "Every creator itinerary on Creatour, filtered by how many days you have, what you want to spend and which cities you want to see.",
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

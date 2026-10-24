import type { Metadata } from "next";
import { PageGuide } from "@/components/page-guide";
import Link from "next/link";
import { getQuizData } from "@/lib/data";
import { TripFinder } from "./finder";

export const metadata: Metadata = {
  title: "Find a trip by length and budget",
  description:
    "Every creator itinerary on Creatour, filtered by how many days you have and what you want to spend.",
};

export default async function TripsPage() {
  const { routes } = await getQuizData();
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Find a trip</h1>
      <p className="mt-1 text-muted">
        Your days, your budget.{" "}
        <Link href="/quiz" className="underline">
          Not sure? 3 quick questions
        </Link>
      </p>
      <PageGuide id="finder" className="mt-6" />
      <TripFinder routes={routes} />
    </>
  );
}

import type { Metadata } from "next";
import { getQuizData } from "@/lib/data";
import { Quiz } from "./quiz";

export const metadata: Metadata = {
  title: "Find your trip",
  description: "Three questions, then the creator itinerary that fits your days, budget and travel style.",
};

export default async function QuizPage() {
  const data = await getQuizData();
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Find your trip</h1>
      <p className="mt-1 text-muted">Three quick questions. We match you to the creator route that fits.</p>
      <Quiz data={data} />
    </>
  );
}

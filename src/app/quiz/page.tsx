import type { Metadata } from "next";
import { getQuizData } from "@/lib/data";
import { PageGuide } from "@/components/page-guide";
import { Quiz } from "./quiz";

export const metadata: Metadata = {
  title: "Find your trip",
  description: "Tap where, how long, your budget style and what you love: the creator itinerary that fits shows up as you go.",
};

export default async function QuizPage() {
  const data = await getQuizData();
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Find your trip</h1>
      <p className="mt-1 text-muted">Tap what fits. Your best route updates as you go.</p>
      <PageGuide id="quiz" className="mt-4" />
      <Quiz data={data} />
    </>
  );
}

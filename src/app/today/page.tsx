import type { Metadata } from "next";
import { TodayView } from "./today-view";

export const metadata: Metadata = { title: "Today", robots: { index: false } };

export default function TodayPage() {
  return <TodayView />;
}

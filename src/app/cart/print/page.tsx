import type { Metadata } from "next";
import { PrintTrip } from "./print-trip";

export const metadata: Metadata = { title: "Print my trip", robots: { index: false } };

export default function PrintPage() {
  return <PrintTrip />;
}

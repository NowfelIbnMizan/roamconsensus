import type { Metadata } from "next";
import { GroupTripView } from "./group-view";

export const metadata: Metadata = { title: "Group trip", robots: { index: false } };

export default function GroupTripPage() {
  return <GroupTripView />;
}

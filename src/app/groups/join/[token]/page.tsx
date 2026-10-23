import type { Metadata } from "next";
import { JoinGroup } from "./join-group";

export const metadata: Metadata = {
  title: "Join a group trip",
  description: "You're invited to plan a trip together on Creatour.",
  robots: { index: false },
};

export default function JoinGroupPage() {
  return <JoinGroup />;
}

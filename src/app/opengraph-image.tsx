import { ogCard, ogSize } from "@/lib/og";

export const alt = "Creatour: see where travel creators agree";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Travel itineraries compared",
    title: "See where travel creators agree",
    detail: "Real creator itineraries, side by side, with what they all recommend.",
  });
}

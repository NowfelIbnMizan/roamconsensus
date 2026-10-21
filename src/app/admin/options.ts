import { categoryLabel, sentimentLabel, tierLabel } from "@/lib/format";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export const categoryOptions = toOptions(categoryLabel);
export const sentimentOptions = toOptions(sentimentLabel);
export const tierOptions = toOptions(tierLabel);
export const platformOptions = toOptions({
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  BLOG: "Blog",
});
export const couponTypeOptions = toOptions({
  PLATFORM: "Ours (our link + our code)",
  PUBLIC: "Public brand promo",
  CREATOR: "Creator's code",
});

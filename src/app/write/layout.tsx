import type { Metadata } from "next";

export const metadata: Metadata = { title: "Write for Creatour", robots: { index: false } };

export default function WriteLayout({ children }: LayoutProps<"/write">) {
  return <div className="mx-auto max-w-3xl">{children}</div>;
}

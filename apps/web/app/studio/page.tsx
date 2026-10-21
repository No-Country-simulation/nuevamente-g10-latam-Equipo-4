import Atlas from "@/components/atlas";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Seu estúdio — Atlas" };
export default function StudioPage() {
  return <Atlas />;
}

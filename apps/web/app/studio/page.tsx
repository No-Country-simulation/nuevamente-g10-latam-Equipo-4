import Atlas from "@/components/atlas";
import type { Metadata } from "next";
import {redirectWithoutSession} from '@/lib/server/session';

export const metadata: Metadata = { title: "Seu estúdio — Atlas" };
export default async function StudioPage() {
  await redirectWithoutSession();
  return <Atlas />;
}

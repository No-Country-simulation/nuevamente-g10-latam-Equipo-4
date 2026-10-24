import type { Metadata } from "next";
import Connections from "@/components/connections";
import "./settings.css";
export const metadata: Metadata = { title: "Conexões e modelos — Atlas" };
export default function SettingsPage() {
  return <Connections />;
}

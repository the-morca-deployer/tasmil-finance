import type { Metadata } from "next";
import { TractionDashboard } from "@/features/traction";

export const metadata: Metadata = {
  title: "Tasmil - Traction",
  description: "Live growth metrics for Tasmil Finance",
  robots: { index: false, follow: false },
};

export default function TractionPage() {
  return <TractionDashboard />;
}

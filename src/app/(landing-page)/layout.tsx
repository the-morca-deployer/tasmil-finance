import type { Metadata } from "next";
import "@/features/landing/landing.css";

export const metadata: Metadata = {
  title: "Tasmil Finance - One Vault. Every Protocol.",
  description:
    "Autonomous DeFi yield optimization on Stellar. One vault, every protocol - deposit USDC or XLM and earn optimal yield automatically.",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  // Each landing route provides its own root wrapper (LandingClient -> .landing-page,
  // access/waitlist -> .wl-page), so the layout only scopes the stylesheet.
  return <>{children}</>;
}

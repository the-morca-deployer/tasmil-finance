import type { Metadata } from "next";
import "@/features/landing/landing.css";

export const metadata: Metadata = {
  title: "Tasmil Finance — One Vault. Every Protocol.",
  description:
    "Autonomous DeFi yield optimization on Stellar. One vault, every protocol — deposit USDC or XLM and earn optimal yield automatically.",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wl-page" data-grid="on" data-motion="on">
      {children}
    </div>
  );
}

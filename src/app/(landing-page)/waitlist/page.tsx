// @ts-nocheck
"use client";

import { Hero, ReferralLoop, WhyJoin } from "@/features/landing/components/wl/landing";
import { BgFX, Footer, Nav, useAccent, useToast } from "@/features/landing/components/wl/shared";

export default function WaitlistPage() {
  const [fireToast, Toast] = useToast();
  useAccent("Aqua");
  return (
    <div className="wl-page" data-grid="on" data-motion="on">
      <BgFX />
      <Nav variant="landing" codeHref="/access" homeHref="/" />
      <Hero accent="Aqua" motion={true} accessHref="/access" onToast={fireToast} />
      <div className="wrap">
        <div className="rule"></div>
      </div>
      <ReferralLoop />
      <WhyJoin />
      <Footer />
      <Toast />
    </div>
  );
}

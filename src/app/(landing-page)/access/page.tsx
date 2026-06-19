// @ts-nocheck
"use client";

import { Suspense } from "react";
import { AccessPage } from "@/features/landing/components/wl/access";
import { BgFX, Footer, Nav, useAccent } from "@/features/landing/components/wl/shared";

function AccessRoute() {
  useAccent("Aqua");
  return (
    <div className="wl-page" data-grid="on" data-motion="on">
      <BgFX />
      <Nav variant="access" codeHref="" homeHref="/waitlist" />
      <AccessPage accent="Aqua" motion={true} homeHref="/waitlist" />
      <Footer />
    </div>
  );
}

export default function AccessRoutePage() {
  return (
    <Suspense>
      <AccessRoute />
    </Suspense>
  );
}

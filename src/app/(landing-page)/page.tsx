"use client";

import dynamic from "next/dynamic";

// Code-split the 3D/GSAP-heavy landing off the server render and shared chunks.
const LandingClient = dynamic(() => import("@/features/landing/components/LandingClient"), {
  ssr: false,
});

// The landing always renders at / for everyone (no auto-redirect for logged-in users).
// The landing nav/hero links into the app (Launch App / waitlist / access).
export default function Home() {
  return <LandingClient />;
}

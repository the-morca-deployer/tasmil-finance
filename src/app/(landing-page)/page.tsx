"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth";

// Code-split the 3D/GSAP-heavy landing off the server render and shared chunks.
const LandingClient = dynamic(() => import("@/features/landing/components/LandingClient"), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, accessCodeRequired } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !accessCodeRequired) {
      router.replace("/chat");
    }
  }, [isAuthenticated, accessCodeRequired, router]);

  // While an authenticated non-gated user is being redirected, render nothing.
  if (isAuthenticated && !accessCodeRequired) return null;

  return <LandingClient />;
}

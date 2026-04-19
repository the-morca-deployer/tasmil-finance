"use client";

import { Onborda, OnbordaProvider as OnbordaContextProvider } from "onborda";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { TourCard } from "@/features/onboarding/components/tour-card";
import { WelcomeModal } from "@/features/onboarding/components/welcome-modal";
import { tours } from "@/features/onboarding/config/tour-steps";
import { useOnboardingTrigger } from "@/features/onboarding/hooks/use-onboarding";

function OnboardingTrigger() {
  useOnboardingTrigger();
  return null;
}

/**
 * Onborda listens to window resize to recalculate pointer positions,
 * but our app scrolls inside <main data-onborda="main-content"> not the window.
 * This bridges the gap by dispatching a resize event when the container scrolls.
 */
function ScrollBridge() {
  useEffect(() => {
    const main = document.querySelector("[data-onborda='main-content']");
    if (!main) return;
    const onScroll = () => window.dispatchEvent(new Event("resize"));
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);
  return null;
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  return (
    <OnbordaContextProvider>
      <Onborda steps={tours} shadowRgb="0,0,0" shadowOpacity="0.7" cardComponent={TourCard}>
        <OnboardingTrigger />
        <ScrollBridge />
        {children}
        <WelcomeModal />
      </Onborda>
    </OnbordaContextProvider>
  );
}

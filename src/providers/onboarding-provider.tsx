"use client";

import { useEffect } from "react";
import { WelcomeModal } from "@/features/onboarding/components/welcome-modal";
import { ONBOARDING_ENABLED } from "@/features/onboarding/config/feature-flag";
import { useWallet } from "@/shared/context/wallet-context";
import { useOnboardingStore } from "@/store/use-onboarding";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { address } = useWallet();
  const { hasCompletedWelcome, openWelcomeModal, welcomeModalOpen } = useOnboardingStore();

  useEffect(() => {
    if (!ONBOARDING_ENABLED) return;
    if (address && !hasCompletedWelcome && !welcomeModalOpen) {
      openWelcomeModal();
    }
  }, [address, hasCompletedWelcome, welcomeModalOpen, openWelcomeModal]);

  if (!ONBOARDING_ENABLED) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <WelcomeModal />
    </>
  );
}

"use client";

import { useEffect } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { useOnboardingStore } from "@/store/use-onboarding";
import { WelcomeModal } from "@/features/onboarding/components/welcome-modal";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { address } = useWallet();
  const { hasCompletedWelcome, openWelcomeModal, welcomeModalOpen } = useOnboardingStore();

  useEffect(() => {
    if (address && !hasCompletedWelcome && !welcomeModalOpen) {
      openWelcomeModal();
    }
  }, [address, hasCompletedWelcome, welcomeModalOpen, openWelcomeModal]);

  return (
    <>
      {children}
      <WelcomeModal />
    </>
  );
}

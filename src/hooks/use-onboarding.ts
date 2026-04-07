import { useState, useEffect } from "react";
import { useWalletStore } from "@/store/use-wallet";

const ONBOARDING_STORAGE_KEY = "tasmil-onboarding-completed";

export function useOnboarding() {
  const { connected: isConnected } = useWalletStore();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Load onboarding state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
      setHasCompletedOnboarding(completed);

      // Show onboarding if user is connected but hasn't completed it
      if (isConnected && !completed) {
        setIsOnboardingOpen(true);
      }
    }
  }, [isConnected]);

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    setIsOnboardingOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    }
  };

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    setIsOnboardingOpen(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  };

  const openOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  // Provide shouldShowOnboarding for backwards compatibility
  const shouldShowOnboarding = isConnected && !hasCompletedOnboarding;

  return {
    hasCompletedOnboarding,
    isOnboardingOpen,
    shouldShowOnboarding,
    completeOnboarding,
    resetOnboarding,
    openOnboarding,
  };
}

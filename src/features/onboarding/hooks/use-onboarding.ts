"use client";

import { useState, useEffect } from "react";

const ONBOARDING_STORAGE_KEY = "tasmil-onboarding-completed";

export function useOnboarding() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  useEffect(() => {
    // Check if onboarding was completed before
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (completed === "true") {
      setIsOnboardingCompleted(true);
    } else {
      // Show onboarding for new users
      setIsOnboardingOpen(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOnboardingCompleted(true);
    setIsOnboardingOpen(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIsOnboardingCompleted(false);
    setIsOnboardingOpen(true);
  };

  const openOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
  };

  return {
    isOnboardingOpen,
    isOnboardingCompleted,
    openOnboarding,
    closeOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}
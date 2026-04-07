"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { OnboardingDialog } from "./onboarding-dialog";
import { useOnboarding } from "@/hooks/use-onboarding";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { isConnected: _isConnected } = useWallet();
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Show onboarding dialog when user connects wallet for the first time
    if (shouldShowOnboarding) {
      // Add a small delay to ensure wallet connection is fully established
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [shouldShowOnboarding]);

  return (
    <>
      {children}
      <OnboardingDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            // If user closes dialog without completing, mark as completed anyway
            // You might want to change this behavior based on your requirements
            completeOnboarding();
          }
        }}
      />
    </>
  );
}

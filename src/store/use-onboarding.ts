import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  hasCompletedWelcome: boolean;
  welcomeModalOpen: boolean;
  openWelcomeModal: () => void;
  closeWelcomeModal: () => void;
  completeWelcome: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedWelcome: false,
      welcomeModalOpen: false,
      openWelcomeModal: () => set({ welcomeModalOpen: true }),
      closeWelcomeModal: () => set({ welcomeModalOpen: false }),
      completeWelcome: () => set({ hasCompletedWelcome: true, welcomeModalOpen: false }),
      resetOnboarding: () => set({ hasCompletedWelcome: false, welcomeModalOpen: false }),
    }),
    {
      name: "tasmil-onboarding",
      partialize: (state) => ({ hasCompletedWelcome: state.hasCompletedWelcome }),
    }
  )
);

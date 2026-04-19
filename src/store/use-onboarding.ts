import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  hasCompletedWelcome: boolean;
  completedTours: string[];
  welcomeModalOpen: boolean;
  openWelcomeModal: () => void;
  closeWelcomeModal: () => void;
  completeWelcome: () => void;
  completeTour: (tourName: string) => void;
  isTourCompleted: (tourName: string) => boolean;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasCompletedWelcome: false,
      completedTours: [],
      welcomeModalOpen: false,
      openWelcomeModal: () => set({ welcomeModalOpen: true }),
      closeWelcomeModal: () => set({ welcomeModalOpen: false }),
      completeWelcome: () => set({ hasCompletedWelcome: true, welcomeModalOpen: false }),
      completeTour: (tourName: string) =>
        set((state) => ({
          completedTours: state.completedTours.includes(tourName)
            ? state.completedTours
            : [...state.completedTours, tourName],
        })),
      isTourCompleted: (tourName: string) => get().completedTours.includes(tourName),
      resetOnboarding: () =>
        set({
          hasCompletedWelcome: false,
          completedTours: [],
          welcomeModalOpen: false,
        }),
    }),
    {
      name: "tasmil-onboarding",
      partialize: (state) => ({
        hasCompletedWelcome: state.hasCompletedWelcome,
        completedTours: state.completedTours,
      }),
    }
  )
);

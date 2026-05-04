import { act } from "@testing-library/react";
import { useOnboardingStore } from "./use-onboarding";

beforeEach(() => {
  localStorage.clear();
  useOnboardingStore.setState({ hasCompletedWelcome: false, welcomeModalOpen: false });
});

describe("useOnboardingStore", () => {
  it("starts with welcome incomplete and modal closed", () => {
    expect(useOnboardingStore.getState().hasCompletedWelcome).toBe(false);
    expect(useOnboardingStore.getState().welcomeModalOpen).toBe(false);
  });

  it("openWelcomeModal opens the modal without marking complete", () => {
    act(() => {
      useOnboardingStore.getState().openWelcomeModal();
    });
    expect(useOnboardingStore.getState().welcomeModalOpen).toBe(true);
    expect(useOnboardingStore.getState().hasCompletedWelcome).toBe(false);
  });

  it("closeWelcomeModal closes without marking complete", () => {
    act(() => {
      useOnboardingStore.getState().openWelcomeModal();
      useOnboardingStore.getState().closeWelcomeModal();
    });
    expect(useOnboardingStore.getState().welcomeModalOpen).toBe(false);
    expect(useOnboardingStore.getState().hasCompletedWelcome).toBe(false);
  });

  it("completeWelcome marks complete AND closes the modal", () => {
    act(() => {
      useOnboardingStore.getState().openWelcomeModal();
      useOnboardingStore.getState().completeWelcome();
    });
    expect(useOnboardingStore.getState().welcomeModalOpen).toBe(false);
    expect(useOnboardingStore.getState().hasCompletedWelcome).toBe(true);
  });

  it("resetOnboarding clears completion", () => {
    act(() => {
      useOnboardingStore.getState().completeWelcome();
      useOnboardingStore.getState().resetOnboarding();
    });
    expect(useOnboardingStore.getState().hasCompletedWelcome).toBe(false);
  });

  it("only persists hasCompletedWelcome (not welcomeModalOpen)", () => {
    act(() => {
      useOnboardingStore.getState().openWelcomeModal();
      useOnboardingStore.getState().completeWelcome();
    });
    const persisted = JSON.parse(localStorage.getItem("tasmil-onboarding") ?? "{}");
    expect(persisted.state).toEqual({ hasCompletedWelcome: true });
  });
});

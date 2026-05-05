import { render, screen } from "@testing-library/react";
import { OnboardingProvider } from "./onboarding-provider";

jest.mock("@/features/onboarding/config/feature-flag", () => ({
  ONBOARDING_ENABLED: false,
}));

jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => ({ address: "GTEST..." }),
}));

jest.mock("@/store/use-onboarding", () => ({
  useOnboardingStore: () => ({
    hasCompletedWelcome: false,
    welcomeModalOpen: false,
    openWelcomeModal: jest.fn(),
  }),
}));

jest.mock("@/features/onboarding/components/welcome-modal", () => ({
  WelcomeModal: () => <div data-testid="welcome-modal" />,
}));

describe("OnboardingProvider with ONBOARDING_ENABLED=false", () => {
  it("renders children and does not mount WelcomeModal", () => {
    render(
      <OnboardingProvider>
        <div data-testid="child">child</div>
      </OnboardingProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-modal")).toBeNull();
  });
});

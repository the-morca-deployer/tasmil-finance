import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStellarBalances } from "@/features/account/hooks/use-stellar-balance";
import { usePresets } from "@/features/account/hooks/use-account-api";
import { useWalletStore } from "@/store/use-wallet";
import { SetupPage } from "./setup-page";

jest.mock("@/features/account/hooks/use-stellar-balance");
jest.mock("@/features/account/hooks/use-account-api");
jest.mock("@/store/use-wallet");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("./step-deploy", () => ({
  StepDeploy: ({ onComplete }: { onComplete: () => void }) => (
    <button type="button" onClick={onComplete}>
      mock-create
    </button>
  ),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

beforeEach(() => {
  sessionStorage.clear();
  (useWalletStore as unknown as jest.Mock).mockReturnValue({ account: "GABC" });
  (useStellarBalances as jest.Mock).mockReturnValue({ data: { usdc: 100, xlm: 200 } });
  (usePresets as jest.Mock).mockReturnValue({
    data: [
      { name: "Safe", estimatedApy: 3.1, poolCount: 1, poolTypes: [], risks: [], topPools: [] },
      { name: "Balanced", estimatedApy: 5.4, poolCount: 3, poolTypes: [], risks: [], topPools: [] },
      { name: "Aggressive", estimatedApy: 8.8, poolCount: 4, poolTypes: [], risks: [], topPools: [] },
    ],
  });
});

describe("SetupPage", () => {
  it("walks Asset -> Strategy -> Preset -> Deploy", async () => {
    render(<SetupPage />, { wrapper });
    expect(screen.getByRole("heading", { name: /Choose deposit asset/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByRole("heading", { name: /Agent strategy/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByRole("heading", { name: /Pick risk preset/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByRole("heading", { name: /Create your smart account/ })).toBeInTheDocument();
  });

  it("locks Custom mode behind Coming soon (Phase 1)", async () => {
    render(<SetupPage />, { wrapper });
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByRole("button", { name: "Custom" })).toBeDisabled();
  });
});

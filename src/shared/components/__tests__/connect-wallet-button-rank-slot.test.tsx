import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectWalletButton } from "../connect-wallet-button";

jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => ({
    isConnected: true,
    address: "GABC123",
    displayAddress: "GABC...123",
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));
jest.mock("@/features/credits/use-credits", () => ({
  useCredits: () => ({ data: { credits: 0 }, isLoading: false }),
}));
jest.mock("@/features/quest/lib/kubb-config", () => ({ $: {} }));
jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetMe: () => ({ data: { totalPoints: 35, loginStreak: 3 } }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: "100", isLoading: false }),
}));

describe("ConnectWalletButton topbar dropdown", () => {
  it("renders the Balance header with inline points + streak", async () => {
    render(<ConnectWalletButton variant="topbar" />);
    // The dropdown content is inside a Radix portal; open the menu first.
    await userEvent.click(screen.getByTestId("wallet-connected"));
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByText("3d")).toBeInTheDocument();
  });
});

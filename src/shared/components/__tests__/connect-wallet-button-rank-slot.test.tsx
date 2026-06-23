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

describe("ConnectWalletButton rankSlot", () => {
  it("renders the provided rankSlot node", async () => {
    render(
      <ConnectWalletButton variant="topbar" rankSlot={<div data-testid="slot">rank-here</div>} />
    );
    // The slot is inside Radix DropdownMenuContent (portal); open the menu first.
    await userEvent.click(screen.getByTestId("wallet-connected"));
    expect(screen.getByTestId("slot")).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPageWrapper } from "./chat-page-wrapper";

jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: jest.fn(),
}));

jest.mock("../providers", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chat-provider">{children}</div>
  ),
}));

jest.mock("./chat-client", () => ({
  ChatClient: () => <div data-testid="chat-client">chat client</div>,
}));

const { useWallet } = jest.requireMock("@/shared/context/wallet-context") as {
  useWallet: jest.Mock;
};

describe("ChatPageWrapper", () => {
  it("uses wallet-only connect when chat is disconnected", async () => {
    const user = userEvent.setup();
    const connectWalletOnly = jest.fn();

    useWallet.mockReturnValue({
      isConnected: false,
      connectWalletOnly,
    });

    render(<ChatPageWrapper agentId="supervisor" chatId="new" />);

    await user.click(screen.getByRole("button", { name: /connect wallet/i }));

    expect(connectWalletOnly).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("chat-provider")).not.toBeInTheDocument();
  });

  it("mounts chat as soon as the wallet is connected, even without backend auth", () => {
    useWallet.mockReturnValue({
      isConnected: true,
      connectWalletOnly: jest.fn(),
    });

    render(<ChatPageWrapper agentId="supervisor" chatId="new" />);

    expect(screen.getByTestId("chat-provider")).toBeInTheDocument();
    expect(screen.getByTestId("chat-client")).toBeInTheDocument();
  });
});

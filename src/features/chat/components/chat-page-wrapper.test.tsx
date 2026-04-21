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
  it("shows connect state when the wallet is disconnected", () => {
    useWallet.mockReturnValue({
      isConnected: false,
      isAuthenticated: false,
      isAuthenticating: false,
      connect: jest.fn(),
      forceReauth: jest.fn(),
    });

    render(<ChatPageWrapper agentId="supervisor" chatId="new" />);

    expect(screen.getByText("Connect your wallet")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-provider")).not.toBeInTheDocument();
  });

  it("shows verifying state while wallet auth is in progress", () => {
    useWallet.mockReturnValue({
      isConnected: true,
      isAuthenticated: false,
      isAuthenticating: true,
      connect: jest.fn(),
      forceReauth: jest.fn(),
    });

    render(<ChatPageWrapper agentId="supervisor" chatId="new" />);

    expect(screen.getByText("Verifying wallet session...")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-provider")).not.toBeInTheDocument();
  });

  it("shows reconnect state after auth failure", async () => {
    const user = userEvent.setup();
    const forceReauth = jest.fn();

    useWallet.mockReturnValue({
      isConnected: true,
      isAuthenticated: false,
      isAuthenticating: false,
      connect: jest.fn(),
      forceReauth,
    });

    render(<ChatPageWrapper agentId="supervisor" chatId="new" />);

    await user.click(screen.getByRole("button", { name: /reconnect wallet/i }));

    expect(forceReauth).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("chat-provider")).not.toBeInTheDocument();
  });

  it("mounts chat only for authenticated users", () => {
    useWallet.mockReturnValue({
      isConnected: true,
      isAuthenticated: true,
      isAuthenticating: false,
      connect: jest.fn(),
      forceReauth: jest.fn(),
    });

    render(<ChatPageWrapper agentId="supervisor" chatId="new" />);

    expect(screen.getByTestId("chat-provider")).toBeInTheDocument();
    expect(screen.getByTestId("chat-client")).toBeInTheDocument();
  });
});

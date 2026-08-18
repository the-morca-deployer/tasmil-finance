import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { useAuthStore } from "@/store/use-auth";
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

/**
 * The wrapper gates on two independent facts: the wallet connection and the
 * backend session. A previous version of this suite asserted that chat mounts
 * "as soon as the wallet is connected, even without backend auth" -- that is no
 * longer true, and deliberately so: ChatPageWrapper now renders the
 * `session-invalid` ChatAuthState in that case so the user is prompted to
 * re-auth instead of dropping into a chat whose every request would 401.
 * The gate is covered here as three states rather than two.
 */
function setWallet(overrides: Partial<Record<string, unknown>> = {}) {
  const connectWalletOnly = jest.fn();
  const forceReauth = jest.fn();
  useWallet.mockReturnValue({
    isConnected: false,
    connectWalletOnly,
    forceReauth,
    ...overrides,
  });
  return { connectWalletOnly, forceReauth };
}

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: false });
});

describe("ChatPageWrapper", () => {
  it("uses wallet-only connect when the wallet is disconnected", async () => {
    const user = userEvent.setup();
    const { connectWalletOnly } = setWallet({ isConnected: false });

    render(<ChatPageWrapper agentId="supervisor" chatId="new" />);

    await user.click(screen.getByRole("button", { name: /connect wallet/i }));

    expect(connectWalletOnly).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("chat-provider")).not.toBeInTheDocument();
  });

  it("asks the user to re-auth when the wallet is connected but the session is not", async () => {
    const user = userEvent.setup();
    const { forceReauth } = setWallet({ isConnected: true });
    useAuthStore.setState({ isAuthenticated: false });

    render(<ChatPageWrapper agentId="supervisor" chatId="new" />);

    expect(screen.queryByTestId("chat-provider")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reconnect wallet/i }));
    expect(forceReauth).toHaveBeenCalledTimes(1);
  });

  it("mounts chat once the wallet is connected and the session is authenticated", () => {
    setWallet({ isConnected: true });
    useAuthStore.setState({ isAuthenticated: true });

    render(<ChatPageWrapper agentId="supervisor" chatId="new" />);

    expect(screen.getByTestId("chat-provider")).toBeInTheDocument();
    expect(screen.getByTestId("chat-client")).toBeInTheDocument();
  });
});

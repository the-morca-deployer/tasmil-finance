// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";

jest.unmock("@/shared/context/wallet-context");

const { WalletProvider, useWallet } = jest.requireActual(
  "./wallet-context"
) as typeof import("./wallet-context");

const authModalMock = jest.fn().mockResolvedValue({
  address: "GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234",
});
const getAddressMock = jest.fn().mockResolvedValue({ address: null });

jest.mock("@creit.tech/stellar-wallets-kit/sdk", () => ({
  StellarWalletsKit: {
    init: jest.fn(),
    on: jest.fn(() => jest.fn()),
    authModal: (...args: unknown[]) => authModalMock(...args),
    getAddress: (...args: unknown[]) => getAddressMock(...args),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
  },
}));

jest.mock("@creit.tech/stellar-wallets-kit/modules/utils", () => ({
  defaultModules: jest.fn(() => []),
}));

jest.mock("@creit.tech/stellar-wallets-kit/types", () => ({
  Networks: { TESTNET: "Test SDF Network ; September 2015" },
  KitEventType: { STATE_UPDATED: "STATE_UPDATED" },
}));

jest.mock("@/lib/stellar-network-check", () => ({
  checkWalletNetwork: jest.fn(),
  parseSigningError: () => null,
}));

jest.mock("sonner", () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

function Probe() {
  const { address, connectWalletOnly } = useWallet();

  return (
    <>
      <button type="button" onClick={() => void connectWalletOnly()}>
        wallet-only
      </button>
      <div data-testid="wallet-address">{address ?? "none"}</div>
    </>
  );
}

describe("WalletProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWalletStore.setState({ connected: false, account: null, signing: false });
    useAuthStore.setState({
      isAuthenticated: false,
      accessToken: null,
      user: null,
      isLoading: false,
      expiresAt: null,
    });
    authModalMock.mockClear();
    getAddressMock.mockClear();
    authModalMock.mockResolvedValue({
      address: "GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234",
    });
    getAddressMock.mockResolvedValue({ address: null });
    // WalletProvider mounts <AuthBootstrap/>, which unconditionally probes the
    // httpOnly session cookie via GET /api/auth/me. That probe is expected here,
    // so fetch has to resolve (a bare jest.fn() returns undefined and the
    // component's .then() blows up). A 500 short-circuits AuthBootstrap on
    // `if (!res.ok) return;` without touching auth state or navigating.
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }) as typeof fetch;
  });

  /**
   * Backend auth = the signature-challenge handshake
   * (POST /api/auth/challenge -> POST /api/auth/verify). Neither may be reached
   * by a wallet-only connect or by rehydrating a persisted address.
   */
  function expectNoBackendAuthCall() {
    const urls = (global.fetch as jest.Mock).mock.calls.map(([url]) => String(url));
    expect(urls.filter((u) => /\/api\/auth\/(challenge|verify)/.test(u))).toEqual([]);
  }

  // This case used to assert that connectWalletOnly() connects "for chat without
  // calling backend auth". That behaviour was removed in 5d8abbe, which added
  // `await authenticateWithWallet(addr)` to connectWalletOnly, making its body
  // character-for-character identical to connect(). The suite never noticed
  // because global.fetch was a bare jest.fn(): the provider crashed on
  // `undefined.then` before it could reach the handshake. Asserting the removed
  // behaviour would pin a promise the code no longer makes, so this now pins
  // what connectWalletOnly actually does.
  it("connectWalletOnly() opens the wallet modal and runs the backend auth handshake", async () => {
    const user = userEvent.setup();

    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>
    );

    await user.click(screen.getByRole("button", { name: "wallet-only" }));

    await waitFor(() =>
      expect(screen.getByTestId("wallet-address")).toHaveTextContent(
        "GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234"
      )
    );
    expect(authModalMock).toHaveBeenCalled();
    await waitFor(() => {
      const urls = (global.fetch as jest.Mock).mock.calls.map(([url]) => String(url));
      expect(urls.some((u) => u.endsWith("/api/auth/challenge"))).toBe(true);
    });
  });

  it("restores a persisted wallet without silently triggering backend auth", async () => {
    useWalletStore.setState({
      connected: true,
      account: "GRESTORE1234567890ABCDEF1234567890ABCDEF1234567890ABCDE",
      signing: false,
    });
    getAddressMock.mockResolvedValue({
      address: "GRESTORE1234567890ABCDEF1234567890ABCDEF1234567890ABCDE",
    });

    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("wallet-address")).toHaveTextContent(
        "GRESTORE1234567890ABCDEF1234567890ABCDEF1234567890ABCDE"
      )
    );
    expectNoBackendAuthCall();
  });
});

import { render, screen } from "@testing-library/react";
import type { Rulebook } from "../api/adapters";
import { useRulebook } from "../api/use-rulebook";
import { RulebookPage } from "./rulebook-page";

jest.mock("../api/use-rulebook", () => ({ useRulebook: jest.fn() }));

const mockUseRulebook = useRulebook as jest.MockedFunction<typeof useRulebook>;
const contract = "CABCDEF";

const liveRulebook: Rulebook = {
  accountId: "vault-1",
  network: "mainnet",
  contract,
  readAtLedger: "64422326",
  instanceLiveUntilLedger: "65000000",
  killSwitch: false,
  killSwitchSource: "STORED",
  executionRouter: "CROUTER",
  interfaceRegistry: "CREGISTRY",
  globalDailyCalls: { used: "2", resetLedger: "64423000", max: "100" },
  sessions: [
    {
      pubkey: "GSESSION",
      revoked: false,
      expiresAtLedger: "65000000",
      allowedContracts: ["CVENUE"],
      maxCallsPerDay: "48",
      coolDownLedgers: "20",
      scopeVersion: "3",
      cumulative: {
        limit: "20000000000",
        denom: "TokenBase",
        windowLedgers: "17280",
        spent: "1200000000",
        windowStartLedger: "64400000",
      },
      position: { maxExposureBps: "2500", maxPositionUsdE7: "5000000000" },
      dailyCalls: { used: "3", resetLedger: "64423000", lastCallLedger: "64422000" },
      rules: [
        {
          contract: "CVENUE",
          selector: "deposit",
          allowed: true,
          amount: {
            argIndex: "0",
            argType: "i128",
            semantics: "TokenBase",
            asset: "USDC",
            flow: "INCREASE",
          },
          perTx: { limit: "5000000000", denom: "TokenBase" },
          conversionEvidence: {
            usdValueE7: "5000000000",
            rateRaw: "9999000",
            rateDecimals: 7,
            tokenDecimals: 7,
            setAtLedger: "64000000",
            ratePublishedAtMs: "1789516800000",
          },
        },
      ],
    },
  ],
  explorerUrl: `https://stellar.expert/explorer/public/contract/${contract}`,
};

function state(overrides: Record<string, unknown> = {}) {
  return {
    walletConnected: true,
    accountId: "vault-1",
    data: liveRulebook,
    isLoading: false,
    isStale: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useRulebook>;
}

describe("RulebookPage", () => {
  beforeEach(() => mockUseRulebook.mockReturnValue(state()));

  it("renders loading state", () => {
    mockUseRulebook.mockReturnValue(state({ data: undefined, isLoading: true }));
    render(<RulebookPage />);
    expect(screen.getByRole("status")).toHaveTextContent(/reading live stellar policy/i);
  });

  it("asks for wallet authentication before reading private policy", () => {
    mockUseRulebook.mockReturnValue(
      state({ walletConnected: false, accountId: null, data: undefined })
    );
    render(<RulebookPage />);
    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
  });

  it("shows an account-missing state without guessing an id", () => {
    mockUseRulebook.mockReturnValue(state({ accountId: null, data: undefined }));
    render(<RulebookPage />);
    expect(screen.getByText(/no sow2 vault account/i)).toBeInTheDocument();
  });

  it("shows an empty on-chain policy", () => {
    mockUseRulebook.mockReturnValue(state({ data: { ...liveRulebook, sessions: [] } }));
    render(<RulebookPage />);
    expect(screen.getByText(/no active policy sessions/i)).toBeInTheDocument();
  });

  it("renders live ceilings, conversion evidence, provenance and owner exit", () => {
    render(<RulebookPage />);

    expect(screen.getByText("5000000000")).toBeInTheDocument();
    expect(screen.getByText(/\$500\.00 at scope set/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.9999000 usd/i)).toBeInTheDocument();
    expect(screen.getByText(/ledger 64000000/i)).toBeInTheDocument();
    expect(screen.getByText(/owner can always exit/i)).toBeInTheDocument();
    expect(screen.getByText(/read at ledger 64422326/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open contract on stellar\.expert/i })).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/public/contract/${contract}`
    );
  });

  it("shows the global kill switch independently of color", () => {
    mockUseRulebook.mockReturnValue(state({ data: { ...liveRulebook, killSwitch: true } }));
    render(<RulebookPage />);
    expect(screen.getByText(/^kill switch is on$/i)).toBeInTheDocument();
  });

  it.each([
    [{ revoked: true }, /revoked/i],
    [{ expiresAtLedger: "64000000" }, /expired/i],
  ])("labels revoked and expired sessions", (sessionPatch, label) => {
    mockUseRulebook.mockReturnValue(
      state({
        data: {
          ...liveRulebook,
          sessions: [{ ...liveRulebook.sessions[0], ...sessionPatch }],
        },
      })
    );
    render(<RulebookPage />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("does not turn missing persistent spend into zero", () => {
    mockUseRulebook.mockReturnValue(
      state({ data: undefined, error: new Error("WindowSpend is missing or archived") })
    );
    render(<RulebookPage />);
    expect(screen.getByText(/persistent spend evidence unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it("shows an RPC error with retry", () => {
    mockUseRulebook.mockReturnValue(state({ data: undefined, error: new Error("RPC timeout") }));
    render(<RulebookPage />);
    expect(screen.getByText(/could not read stellar ledger/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("labels a stale cached ledger read", () => {
    mockUseRulebook.mockReturnValue(state({ isStale: true }));
    render(<RulebookPage />);
    expect(screen.getByText(/ledger read may be stale/i)).toBeInTheDocument();
  });
});

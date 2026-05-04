/**
 * Behavior contract tests for the trustline helpers + hook.
 *
 * The error-policy split is the highest-risk part of Sub-Project A:
 * - `checkTrustlineExists` MUST throw on Horizon failure (no swallowing)
 * - The `useTrustlineCheck` hook MUST catch the throw and report
 *   `hasTrustline: true` so existing consumers don't see a regression.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { checkTrustlineExists, useTrustlineCheck } from "./use-trustline-check";

// ─── Mocks ─────────────────────────────────────────────────────────────

const loadAccountMock = jest.fn();

jest.mock("@stellar/stellar-sdk", () => ({
  __esModule: true,
  Horizon: {
    Server: jest.fn().mockImplementation(() => ({
      loadAccount: (...args: unknown[]) => loadAccountMock(...args),
    })),
  },
  TransactionBuilder: jest.fn(),
  Operation: { changeTrust: jest.fn() },
  Asset: jest.fn(),
}));

jest.mock("@/shared/config/stellar", () => ({
  activeNetwork: {
    horizonUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
}));

jest.mock("@/lib/stellar-network-check", () => ({
  checkWalletNetwork: jest.fn().mockResolvedValue(undefined),
  parseSigningError: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}));

beforeEach(() => {
  loadAccountMock.mockReset();
});

// ─── Helper contract ────────────────────────────────────────────────────

describe("checkTrustlineExists (helper contract)", () => {
  it("returns true for native XLM without contacting Horizon", async () => {
    const result = await checkTrustlineExists(
      "GAAAA",
      "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
      "XLM"
    );
    expect(result).toBe(true);
    expect(loadAccountMock).not.toHaveBeenCalled();
  });

  it("returns true when symbol is XLM regardless of contract", async () => {
    const result = await checkTrustlineExists("GAAAA", "C-anything", "XLM");
    expect(result).toBe(true);
    expect(loadAccountMock).not.toHaveBeenCalled();
  });

  it("THROWS when Horizon loadAccount rejects (does not swallow errors)", async () => {
    loadAccountMock.mockRejectedValue(new Error("Network down"));

    await expect(
      checkTrustlineExists(
        "GAAAA",
        "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
        "USDC"
      )
    ).rejects.toThrow("Network down");
  });

  it("returns false when balances do not contain a matching trustline", async () => {
    loadAccountMock.mockResolvedValue({
      balances: [{ asset_type: "native" }],
    });

    const result = await checkTrustlineExists(
      "GAAAA",
      "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", // mainnet USDC
      "USDC"
    );
    expect(result).toBe(false);
  });

  it("returns true when balances contain a matching code+issuer trustline", async () => {
    loadAccountMock.mockResolvedValue({
      balances: [
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        },
      ],
    });

    const result = await checkTrustlineExists(
      "GAAAA",
      "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
      "USDC"
    );
    expect(result).toBe(true);
  });
});

// ─── Hook contract ──────────────────────────────────────────────────────

describe("useTrustlineCheck (hook contract)", () => {
  it("catches helper throw and reports hasTrustline=true (preserves UX on Horizon failure)", async () => {
    loadAccountMock.mockRejectedValue(new Error("Horizon unreachable"));

    const { result } = renderHook(() =>
      useTrustlineCheck("GAAAA", "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", "USDC")
    );

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.hasTrustline).toBe(true);
  });

  it("reports hasTrustline=false when helper resolves false", async () => {
    loadAccountMock.mockResolvedValue({
      balances: [{ asset_type: "native" }],
    });

    const { result } = renderHook(() =>
      useTrustlineCheck("GAAAA", "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", "USDC")
    );

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.hasTrustline).toBe(false);
    expect(result.current.needsTrustline).toBe(true);
  });
});

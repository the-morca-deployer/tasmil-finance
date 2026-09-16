import { parseTractionData } from "../evidence";

const evidence = {
  summary: {
    totalTvlUsd: 0,
    totalUsers: 0,
    avgApyPercent: 0,
    totalTransactions: 0,
  },
  volumeTvl: [],
  userGrowth: [],
  txByType: [],
  publicLedger: {
    state: "FULL",
    network: "mainnet",
    sourceContract: `C${"A".repeat(55)}`,
    range: {
      requestedStartLedger: "90",
      effectiveStartLedger: "90",
      oldestLedger: "80",
      latestLedger: "200",
      truncated: false,
    },
    transactionCount: 0,
    walletCount: 0,
    volumeByVenue: [],
    tvlByVenue: [],
    horizon: {
      endpoint: "https://horizon.stellar.org",
      state: "VERIFIED",
      verifiedTransactions: 0,
    },
    rawEventDigest: "ab".repeat(32),
  },
  reconciliation: {
    cachedTransactionCount: 0,
    publicLedgerTransactionCount: 0,
    transactionCountDelta: 0,
    registeredUsers: 0,
    publicLedgerWallets: 0,
  },
  updatedAt: "2026-09-16T00:00:00.000Z",
};

describe("traction evidence boundary", () => {
  it("preserves exact base-unit integer strings and validates reconciliation", () => {
    const parsed = parseTractionData({
      ...evidence,
      publicLedger: {
        ...evidence.publicLedger,
        volumeByVenue: [{ venue: `C${"B".repeat(55)}`, amountBaseUnits: "90071992547409931234" }],
      },
    });

    expect(parsed.publicLedger.volumeByVenue[0]?.amountBaseUnits).toBe("90071992547409931234");
  });

  it.each(["1.5", "01", "-1"])("rejects non-canonical base-unit value %s", (value) => {
    expect(() =>
      parseTractionData({
        ...evidence,
        publicLedger: {
          ...evidence.publicLedger,
          volumeByVenue: [{ venue: `C${"B".repeat(55)}`, amountBaseUnits: value }],
        },
      })
    ).toThrow();
  });

  it("rejects a public-ledger count that disagrees with reconciliation", () => {
    expect(() =>
      parseTractionData({
        ...evidence,
        reconciliation: { ...evidence.reconciliation, publicLedgerTransactionCount: 1 },
      })
    ).toThrow(/reconciliation/i);
  });

  it("rejects non-mainnet or non-Stellar provenance", () => {
    expect(() =>
      parseTractionData({
        ...evidence,
        publicLedger: { ...evidence.publicLedger, network: "testnet" },
      })
    ).toThrow();
  });
});

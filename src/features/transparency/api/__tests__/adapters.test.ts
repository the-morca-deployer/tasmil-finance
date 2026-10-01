import { adaptActivityPage, adaptFeePage, adaptReplay, adaptRulebook } from "../adapters";

const mainnetContract = "CABC";
const txHash = "ab".repeat(32);

describe("SOW2 transparency adapters", () => {
  it("preserves decimal strings exactly and normalizes safe ledger numbers", () => {
    const page = adaptFeePage({
      network: "mainnet",
      sourceContract: mainnetContract,
      readRange: {
        requestedStartLedger: 64_000_000,
        effectiveStartLedger: "64000001",
        oldestLedger: 63_000_000,
        latestLedger: "64422326",
        partial: true,
      },
      events: [
        {
          id: "event-1",
          type: "perf_fee",
          network: "mainnet",
          sourceContract: mainnetContract,
          ledger: 64_422_326,
          ledgerClosedAt: "2026-09-16T00:00:00.000Z",
          wallet: null,
          strategy: null,
          amount: "9007199254740993123456789",
          details: ["9007199254740993123456789"],
          txHash,
          txStatus: "CONFIRMED",
          explorerUrl: `https://stellar.expert/explorer/public/tx/${txHash}`,
        },
      ],
      nextCursor: "64422326-1",
    });

    expect(page.events[0]?.amount).toBe("9007199254740993123456789");
    expect(page.events[0]?.ledger).toBe("64422326");
    expect(page.readRange.oldestLedger).toBe("63000000");
    expect(page.nextCursor).toBe("64422326-1");
  });

  it("rejects lossy numeric monetary values", () => {
    expect(() =>
      adaptFeePage({
        network: "testnet",
        sourceContract: "CTEST",
        readRange: {
          requestedStartLedger: null,
          effectiveStartLedger: null,
          oldestLedger: "1",
          latestLedger: "2",
          partial: false,
        },
        events: [
          {
            id: "event-1",
            type: "exec_fee",
            network: "testnet",
            sourceContract: "CTEST",
            ledger: "2",
            ledgerClosedAt: "2026-09-16T00:00:00.000Z",
            wallet: null,
            strategy: null,
            amount: 9_007_199_254_740_992,
            details: [],
            txHash,
            txStatus: "CONFIRMED",
            explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
          },
        ],
        nextCursor: null,
      })
    ).toThrow();
  });

  it("preserves UNKNOWN and accepts an activity page without a transaction", () => {
    const page = adaptActivityPage({
      items: [
        {
          id: "vdl-1",
          accountId: "vault-1",
          streamId: "decision:1",
          seq: "3",
          entryType: "UNKNOWN",
          decisionId: "decision-1",
          payload: { reason: "RPC_TIMEOUT" },
          network: "testnet",
          latestLedger: 12_345,
          txHash: null,
          txStatus: "UNKNOWN",
          explorerUrl: null,
          createdAt: "2026-09-16T00:00:00.000Z",
        },
      ],
      nextCursor: null,
    });

    expect(page.items[0]).toMatchObject({
      entryType: "UNKNOWN",
      txStatus: "UNKNOWN",
      latestLedger: "12345",
      txHash: null,
      explorerUrl: null,
    });
  });

  it("normalizes an absent replay transaction to null", () => {
    expect(
      adaptReplay({
        decisionId: "decision-1",
        accountId: "vault-1",
        network: "mainnet",
        stages: [],
        chainValid: true,
        entriesVerified: 2,
        recomputedRoot: "cd".repeat(32),
      })
    ).toMatchObject({ finalTx: null, finalTxStatus: null, finalTxExplorer: null });
  });

  it("rejects explorer links whose network disagrees with the evidence", () => {
    expect(() =>
      adaptReplay({
        decisionId: "decision-1",
        accountId: "vault-1",
        network: "testnet",
        stages: [],
        chainValid: true,
        entriesVerified: 1,
        recomputedRoot: "cd".repeat(32),
        finalTx: txHash,
        finalTxStatus: "CONFIRMED",
        finalTxExplorer: `https://stellar.expert/explorer/public/tx/${txHash}`,
      })
    ).toThrow(/explorer/i);
  });

  it("normalizes rulebook ledger fields and verifies its contract explorer", () => {
    const rulebook = adaptRulebook({
      accountId: "vault-1",
      network: "testnet",
      contract: "CTEST",
      readAtLedger: 123,
      instanceLiveUntilLedger: "456",
      killSwitch: false,
      killSwitchSource: "STORED",
      executionRouter: null,
      interfaceRegistry: null,
      globalDailyCalls: { used: "0", resetLedger: null, max: "100" },
      sessions: [],
      explorerUrl: "https://stellar.expert/explorer/testnet/contract/CTEST",
    });

    expect(rulebook.readAtLedger).toBe("123");
    expect(rulebook.instanceLiveUntilLedger).toBe("456");
  });
});

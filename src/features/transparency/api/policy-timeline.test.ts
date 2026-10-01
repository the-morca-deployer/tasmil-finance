import type { ActivityPage } from "./adapters";
import { toPolicyTimelineItem } from "./policy-timeline";

type VdlItem = ActivityPage["items"][number];

const TX = "a".repeat(64);

function vdl(patch: Partial<VdlItem>): VdlItem {
  return {
    id: "e1",
    accountId: "acct",
    streamId: "decision:d1",
    seq: "1",
    entryType: "DECISION",
    decisionId: "d1",
    payload: {},
    network: "mainnet",
    latestLedger: "64700000",
    txHash: null,
    txStatus: null,
    explorerUrl: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    ...patch,
  };
}

describe("toPolicyTimelineItem", () => {
  it("uses the Net-Edge plain-language reason for a decline", () => {
    const row = toPolicyTimelineItem(
      vdl({
        entryType: "DECLINE",
        payload: { gate: "NET_EDGE", plainLanguage: "Gain $0.04 is below cost $0.11" },
      })
    );
    expect(row).toMatchObject({
      outcome: "declined",
      title: "Agent declined a move",
      reason: "Gain $0.04 is below cost $0.11",
      decisionId: "d1",
    });
  });

  it("explains a price refusal in plain words", () => {
    const row = toPolicyTimelineItem(
      vdl({ entryType: "REFUSAL", payload: { gate: "PRICE", code: "PRICE_DISAGREEMENT" } })
    );
    expect(row.outcome).toBe("refused");
    expect(row.reason).toBe("Price sources disagreed beyond the allowed band");
  });

  it("marks an on-chain failure as a Policy Guard rejection with its tx link", () => {
    const url = `https://stellar.expert/explorer/public/tx/${TX}`;
    const row = toPolicyTimelineItem(
      vdl({ entryType: "FAILED", txHash: TX, explorerUrl: url, txStatus: "FAILED" })
    );
    expect(row).toMatchObject({ outcome: "rejected", txUrl: url });
  });

  it("treats a confirmed transaction as executed regardless of entry type", () => {
    expect(toPolicyTimelineItem(vdl({ txStatus: "CONFIRMED" })).outcome).toBe("executed");
  });

  it("has no replay dialog target without a decision id", () => {
    expect(toPolicyTimelineItem(vdl({ decisionId: null })).decisionId).toBeNull();
  });
});

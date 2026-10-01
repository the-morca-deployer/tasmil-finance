import { policyDecisionMessageSchema } from "../flow-messages.schema";

const observation = {
  sourceId: "reflector",
  sourceKind: "REFLECTOR",
  status: "FRESH",
  network: "mainnet",
  upstreamId: "stellar:mainnet:reflector",
  rawValue: "18029999768543",
  decimals: 14,
  publishedAtMs: "1789343400000",
  observedAtMs: "1789344000000",
  ledger: "59000000",
};

const message = {
  kind: "policy_decision",
  policyDecision: {
    decision: "DECLINE",
    status: "DECLINED",
    rule: "NET_EDGE",
    arithmetic: {
      kind: "NET_EDGE",
      unit: "USD_MICRO",
      notionalUsdMicros: "250000000",
      deltaApyBps: "1800",
      horizonDays: "14",
      gasFeeUsdMicros: "42100",
      slippageUsdMicros: "625000",
      priceImpactUsdMicros: "187500",
      lockupCostUsdMicros: "0",
      execFeeUsdMicros: "250000",
      expectedGrossGainUsdMicros: "1726027",
      costTotalUsdMicros: "1104600",
      uncertaintyHaircutUsdMicros: "690411",
      netEdgeUsdMicros: "-68984",
    },
    observations: [observation],
    plainLanguage: "Costs and uncertainty exceed gross gain.",
    decisionId: "decision-1",
  },
  message: "Backend-authored explanation",
  actions: [{ kind: "view_replay", decisionId: "decision-1" }],
};

describe("policyDecisionMessageSchema", () => {
  it("preserves exact authoritative arithmetic", () => {
    const parsed = policyDecisionMessageSchema.parse(message);
    expect(parsed.policyDecision.arithmetic).toMatchObject({
      expectedGrossGainUsdMicros: "1726027",
      costTotalUsdMicros: "1104600",
      uncertaintyHaircutUsdMicros: "690411",
      netEdgeUsdMicros: "-68984",
    });
  });

  it("rejects floats, execute actions and mixed Stellar networks", () => {
    expect(() =>
      policyDecisionMessageSchema.parse({
        ...message,
        policyDecision: {
          ...message.policyDecision,
          arithmetic: { ...message.policyDecision.arithmetic, gasFeeUsdMicros: 42100.5 },
        },
      })
    ).toThrow();
    expect(() =>
      policyDecisionMessageSchema.parse({
        ...message,
        actions: [{ kind: "execute", decisionId: "decision-1" }],
      })
    ).toThrow();
    expect(() =>
      policyDecisionMessageSchema.parse({
        ...message,
        policyDecision: {
          ...message.policyDecision,
          observations: [observation, { ...observation, network: "testnet" }],
        },
      })
    ).toThrow();
  });

  it("requires UNKNOWN to carry one tx hash and refresh/replay actions", () => {
    expect(() =>
      policyDecisionMessageSchema.parse({
        ...message,
        policyDecision: {
          ...message.policyDecision,
          decision: "EXECUTE",
          status: "UNKNOWN",
          rule: "EXECUTION",
          arithmetic: {
            kind: "EXECUTION",
            submissionAttempt: "1",
            sourceSequence: "991",
            validUntilLedger: "59001000",
          },
        },
      })
    ).toThrow();
  });
});

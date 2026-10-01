import { fireEvent, render, screen } from "@testing-library/react";
import type { PolicyDecisionMessage } from "@/features/chat/types/flow-messages";
import { PolicyDeclineCard } from "../policy-decline-card";

const observation = {
  sourceId: "reflector",
  sourceKind: "REFLECTOR" as const,
  status: "FRESH" as const,
  network: "mainnet" as const,
  upstreamId: "stellar:mainnet:reflector",
  rawValue: "18029999768543",
  decimals: 14,
  publishedAtMs: "1789343400000",
  observedAtMs: "1789344000000",
  ledger: "59000000",
};

const netEdgeMessage: PolicyDecisionMessage = {
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
    decisionId: "decision-net-edge",
    txHash: null,
  },
  message: "Declined using backend arithmetic.",
  actions: [{ kind: "view_replay", decisionId: "decision-net-edge" }],
};

describe("PolicyDeclineCard", () => {
  it("renders every exact Net-Edge operand and no execute action", () => {
    render(<PolicyDeclineCard message={netEdgeMessage} />);
    for (const value of ["1726027", "1104600", "690411", "-68984"]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: /execute/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /replay evidence/i })).toHaveAttribute(
      "href",
      "/activity/decision-net-edge"
    );
  });

  it.each([
    ["PRICE_INTEGRITY", "Price evidence refused"],
    ["POLICY", "Policy declined"],
    ["WASM_PIN", "Contract code refused"],
  ])("renders %s refusal without a signing action", (rule, label) => {
    const arithmetic =
      rule === "PRICE_INTEGRITY"
        ? {
            kind: "PRICE_INTEGRITY" as const,
            asset: "XLM",
            freshSources: "1",
            requiredSources: "2",
            maxDeviationBps: "231",
            allowedDeviationBps: "200",
          }
        : rule === "POLICY"
          ? {
              kind: "POLICY_CHECK" as const,
              check: "VENUE_ALLOWLIST" as const,
              unit: "CONTRACT" as const,
              actual: null,
              limit: null,
            }
          : {
              kind: "WASM_PIN" as const,
              contractId: "CVENUE",
              expectedWasmHash: "11".repeat(32),
              observedWasmHash: "22".repeat(32),
            };
    const typed = {
      ...netEdgeMessage,
      policyDecision: {
        ...netEdgeMessage.policyDecision,
        decision: "REFUSE" as const,
        status: "REFUSED" as const,
        rule,
        arithmetic,
      },
    } as PolicyDecisionMessage;
    render(<PolicyDeclineCard message={typed} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /execute/i })).not.toBeInTheDocument();
  });

  it.each([
    ["SPEND_CEILING", "2500000000", "1000000000"],
    ["KILL_SWITCH", null, null],
  ])("renders the %s policy comparison without execute", (check, actual, limit) => {
    const typed = {
      ...netEdgeMessage,
      policyDecision: {
        ...netEdgeMessage.policyDecision,
        rule: "POLICY",
        arithmetic: {
          kind: "POLICY_CHECK",
          check,
          unit: check === "SPEND_CEILING" ? "TOKEN_BASE" : "BOOLEAN",
          actual,
          limit,
        },
      },
    } as PolicyDecisionMessage;
    render(<PolicyDeclineCard message={typed} />);
    expect(screen.getByText(new RegExp(check))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /execute/i })).not.toBeInTheDocument();
  });

  it("offers refresh/replay only for UNKNOWN and preserves the decision id", () => {
    const onRefresh = jest.fn();
    const unknown: PolicyDecisionMessage = {
      ...netEdgeMessage,
      policyDecision: {
        ...netEdgeMessage.policyDecision,
        decision: "EXECUTE",
        status: "UNKNOWN",
        rule: "EXECUTION",
        arithmetic: {
          kind: "EXECUTION",
          submissionAttempt: "1",
          sourceSequence: "991",
          validUntilLedger: "59001000",
          confirmedLedger: null,
        },
        decisionId: "decision-unknown",
        txHash: "ab".repeat(32),
      },
      actions: [
        { kind: "refresh_status", decisionId: "decision-unknown", txHash: "ab".repeat(32) },
        { kind: "view_replay", decisionId: "decision-unknown" },
      ],
    };
    render(<PolicyDeclineCard message={unknown} onRefreshStatus={onRefresh} />);
    fireEvent.click(screen.getByRole("button", { name: /refresh status/i }));
    expect(onRefresh).toHaveBeenCalledWith("decision-unknown");
    expect(screen.getByRole("link", { name: /replay evidence/i })).toHaveAttribute(
      "href",
      "/activity/decision-unknown"
    );
    expect(screen.queryByRole("button", { name: /execute/i })).not.toBeInTheDocument();
  });
});

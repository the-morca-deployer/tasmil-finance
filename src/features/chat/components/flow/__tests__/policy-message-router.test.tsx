import { render, screen } from "@testing-library/react";
import type { PolicyDecisionMessage } from "@/features/chat/types/flow-messages";
import { FlowMessageRouter } from "../flow-message-router";

const message: PolicyDecisionMessage = {
  kind: "policy_decision",
  policyDecision: {
    decision: "DECLINE",
    status: "DECLINED",
    rule: "POLICY",
    arithmetic: {
      kind: "POLICY_CHECK",
      check: "KILL_SWITCH",
      unit: "BOOLEAN",
      actual: null,
      limit: null,
    },
    observations: [
      {
        sourceId: "policy",
        sourceKind: "POLICY",
        status: "FRESH",
        network: "testnet",
        upstreamId: "stellar:testnet:keeper",
        rawValue: null,
        decimals: null,
        publishedAtMs: null,
        observedAtMs: "1789344000000",
        ledger: "59000000",
      },
    ],
    plainLanguage: "Kill switch is active.",
    decisionId: "decision-kill-switch",
    txHash: null,
  },
  message: "Declined by the on-chain kill switch. No transaction was submitted.",
  actions: [{ kind: "view_replay", decisionId: "decision-kill-switch" }],
};

it("routes typed policy outcomes to a non-signing card", () => {
  render(<FlowMessageRouter message={message} />);
  expect(screen.getByText("Policy declined")).toBeInTheDocument();
  expect(screen.getByText(/on-chain kill switch/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /confirm|execute|sign/i })).not.toBeInTheDocument();
});

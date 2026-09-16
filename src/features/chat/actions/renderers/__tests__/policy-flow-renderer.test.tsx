// @ts-nocheck -- the renderer registry intentionally accepts heterogeneous tool payloads.
import { render, screen } from "@testing-library/react";
import { FLOW_RENDERER_ENTRIES } from "../flow-renderers";

jest.mock("@/features/chat/hooks/use-flow-signing", () => ({ useFlowSigning: jest.fn() }));
jest.mock("@/features/chat/hooks/use-stream", () => ({ useStreamContext: jest.fn() }));
jest.mock("../execute-dispatcher", () => ({ executeDispatchRender: jest.fn() }));

const result = {
  kind: "policy_decision",
  policyDecision: {
    decision: "REFUSE",
    status: "REFUSED",
    rule: "PRICE_INTEGRITY",
    arithmetic: {
      kind: "PRICE_INTEGRITY",
      asset: "XLM",
      freshSources: "1",
      requiredSources: "2",
      maxDeviationBps: null,
      allowedDeviationBps: "200",
    },
    observations: [
      {
        sourceId: "reflector",
        sourceKind: "REFLECTOR",
        status: "STALE",
        network: "mainnet",
        upstreamId: "stellar:mainnet:reflector",
        rawValue: "18029999768543",
        decimals: 14,
        publishedAtMs: "1789343400000",
        observedAtMs: "1789344000000",
        ledger: "59000000",
      },
    ],
    plainLanguage: "Price evidence is stale.",
    decisionId: "decision-price",
  },
  message: "Price guard refused because only 1/2 sources were fresh.",
  actions: [{ kind: "view_replay", decisionId: "decision-price" }],
};

it.each(["flow_compose_plan", "flow_compose_and_execute"])(
  "%s renders backend refusal before any signing UI",
  (toolName) => {
    const entry = FLOW_RENDERER_ENTRIES.find((candidate) => candidate.toolName === toolName);
    render(entry!.render({ status: "complete", args: {}, result }));
    expect(screen.getByText("Price evidence refused")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirm|execute|sign/i })).not.toBeInTheDocument();
  }
);

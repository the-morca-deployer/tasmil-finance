import { render, screen } from "@testing-library/react";
import { useDecisionReplay } from "../api/use-decision-replay";
import { DecisionReplayPage } from "./decision-replay-page";

jest.mock("../api/use-decision-replay", () => ({ useDecisionReplay: jest.fn() }));

const mockUseReplay = useDecisionReplay as jest.MockedFunction<typeof useDecisionReplay>;

describe("DecisionReplayPage", () => {
  it("shows verified stages without inventing a transaction", () => {
    mockUseReplay.mockReturnValue({
      data: {
        decisionId: "decision-1",
        accountId: "vault-1",
        network: "mainnet",
        stages: [{ type: "DECISION", latestLedger: "123" }],
        chainValid: true,
        entriesVerified: 1,
        recomputedRoot: "ab".repeat(32),
        anchorTx: null,
        finalTx: null,
        finalTxStatus: null,
        finalTxExplorer: null,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<DecisionReplayPage decisionId="decision-1" />);
    expect(screen.getByText(/signature chain valid/i)).toBeInTheDocument();
    expect(screen.getByText(/no transaction submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/DECISION/)).toBeInTheDocument();
  });
});

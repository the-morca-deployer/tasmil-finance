import { fireEvent, render, screen } from "@testing-library/react";
import { useDecisionReplay } from "../api/use-decision-replay";
import { DecisionReplayDialog } from "./decision-replay-dialog";

jest.mock("../api/use-decision-replay", () => ({ useDecisionReplay: jest.fn() }));

const mockUseReplay = useDecisionReplay as jest.MockedFunction<typeof useDecisionReplay>;

describe("DecisionReplayDialog", () => {
  it("shows signed evidence in place and closes without navigation", () => {
    const onOpenChange = jest.fn();
    mockUseReplay.mockReturnValue({
      data: {
        decisionId: "decision-1",
        accountId: "vault-1",
        network: "mainnet",
        stages: [{ type: "REFUSAL", payload: { reason: "Price quorum failed" } }],
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

    render(<DecisionReplayDialog decisionId="decision-1" onOpenChange={onOpenChange} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("decision-1")).toBeInTheDocument();
    expect(screen.getByText(/signature chain valid/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close replay/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import type { TxGroup } from "../../lib/types";
import { TransactionRow } from "../transaction-row";

function makeGroup(over: Partial<TxGroup> = {}): TxGroup {
  const base: TxGroup = {
    txHash: "tx_abc",
    createdAt: "2026-05-04T10:00:00Z",
    successful: true,
    primary: {
      id: "op1",
      txHash: "tx_abc",
      pagingToken: "1",
      createdAt: "2026-05-04T10:00:00Z",
      kind: "send",
      successful: true,
      deltas: [{ code: "XLM", amount: "10", isCredit: false }],
      rawType: "payment",
    },
    ops: [],
    attrs: {},
    ...over,
  };
  if (!over.ops) base.ops = [base.primary];
  return base;
}

describe("<TransactionRow>", () => {
  it("renders the asset code as title for send", () => {
    render(<TransactionRow group={makeGroup()} address="GA" />);
    expect(screen.getByText("XLM")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();
  });

  it("renders signed debit amount with neutral foreground", () => {
    render(<TransactionRow group={makeGroup()} address="GA" />);
    const amount = screen.getByTestId("primary-amount");
    expect(amount).toHaveTextContent("−10");
    expect(amount.className).toMatch(/text-foreground/);
  });

  it("renders + N ops badge for multi-op groups", () => {
    const g = makeGroup();
    g.ops = [g.primary, { ...g.primary, id: "op2" }, { ...g.primary, id: "op3" }];
    render(<TransactionRow group={g} address="GA" />);
    expect(screen.getByText(/\+ 2 ops/)).toBeInTheDocument();
  });

  it("renders failed variant for failed transactions", () => {
    const g = makeGroup({ successful: false });
    render(<TransactionRow group={g} address="GA" />);
    expect(screen.getByText("Transaction Failed")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders 'SRC to DST' title for swaps", () => {
    const g = makeGroup({
      primary: {
        ...makeGroup().primary,
        kind: "swap",
        deltas: [
          { code: "XLM", amount: "100", isCredit: false },
          { code: "USDC", amount: "23.5", isCredit: true },
        ],
      },
    });
    g.ops = [g.primary];
    render(<TransactionRow group={g} address="GA" />);
    expect(screen.getByText("XLM to USDC")).toBeInTheDocument();
    expect(screen.getByText("Swapped")).toBeInTheDocument();
    const amount = screen.getByTestId("primary-amount");
    expect(amount).toHaveTextContent("USDC");
    expect(amount.className).toMatch(/emerald/);
  });

  it("renders Multiple when contract-other has multiple distinct deltas", () => {
    const g = makeGroup({
      primary: {
        ...makeGroup().primary,
        kind: "contract-other",
        deltas: [
          { code: "USDC", amount: "1", isCredit: false },
          { code: "XLM", amount: "2", isCredit: true },
        ],
      },
    });
    g.ops = [g.primary];
    render(<TransactionRow group={g} address="GA" />);
    expect(screen.getByTestId("primary-amount")).toHaveTextContent("Multiple");
    expect(screen.getByText("Contract Function")).toBeInTheDocument();
    expect(screen.getByText("Interacted")).toBeInTheDocument();
  });

  it("toggles the detail panel on click", () => {
    render(<TransactionRow group={makeGroup()} address="GA" />);
    expect(screen.queryByTestId("tx-detail-panel")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /XLM/ }));
    expect(screen.getByTestId("tx-detail-panel")).toBeInTheDocument();
  });
});

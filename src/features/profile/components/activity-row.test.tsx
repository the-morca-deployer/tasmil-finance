import { render, screen } from "@testing-library/react";
import type { ActivityItem } from "@/features/account/types";
import { ActivityRow } from "./activity-row";

const baseDeposit: ActivityItem = {
  id: "1",
  type: "DEPOSIT",
  category: "protocol",
  amount: 1.5,
  amountUsd: 1.51,
  token: "USDC",
  pool: { protocol: "blend", name: "blend USDC", assetSymbol: "USDC" },
  txHash: "abc",
  createdAt: new Date().toISOString(),
};

describe("ActivityRow", () => {
  it("renders amount in human units, not raw stroops", () => {
    render(<ActivityRow activity={baseDeposit} />);
    expect(screen.getByText(/1\.5\s*USDC/)).toBeInTheDocument();
    expect(screen.queryByText(/15000000/)).not.toBeInTheDocument();
  });

  it("renders USD value when present", () => {
    render(<ActivityRow activity={baseDeposit} />);
    expect(screen.getByText(/\$1\.51/)).toBeInTheDocument();
  });

  it("prefixes reward rows with +", () => {
    render(
      <ActivityRow
        activity={{
          ...baseDeposit,
          type: "HARVEST",
          category: "reward",
          token: "BLND",
        }}
      />
    );
    expect(screen.getByText(/\+\s*1\.5\s*BLND/)).toBeInTheDocument();
  });

  it("falls back to action icon when pool absent", () => {
    render(<ActivityRow activity={{ ...baseDeposit, pool: undefined }} />);
    expect(screen.getByTestId("activity-row")).toBeInTheDocument();
  });
});

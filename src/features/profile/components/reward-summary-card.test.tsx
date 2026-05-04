import { render, screen } from "@testing-library/react";
import type { ActivityItem } from "@/features/account/types";
import { RewardSummaryCard } from "./reward-summary-card";

const harvest1: ActivityItem = {
  id: "1",
  type: "HARVEST",
  category: "reward",
  amountUsd: 5,
  metadata: {
    perPool: [
      {
        poolId: "p1",
        protocol: "blend",
        token: "BLND",
        amount: 1.5,
        amountUsd: 3,
      },
      {
        poolId: "p2",
        protocol: "blend",
        token: "BLND",
        amount: 1.0,
        amountUsd: 2,
      },
    ],
  },
  createdAt: new Date().toISOString(),
};
const harvest2: ActivityItem = {
  id: "2",
  type: "HARVEST",
  category: "reward",
  amountUsd: 10,
  metadata: {
    perPool: [
      {
        poolId: "p3",
        protocol: "aquarius",
        token: "AQUA",
        amount: 100,
        amountUsd: 10,
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

describe("RewardSummaryCard", () => {
  it("aggregates lifetime USD", () => {
    render(<RewardSummaryCard activities={[harvest1, harvest2]} />);
    expect(screen.getByText(/\$15(\.\d+)?/)).toBeInTheDocument();
  });

  it("aggregates per-token totals", () => {
    render(<RewardSummaryCard activities={[harvest1, harvest2]} />);
    expect(screen.getByText(/2\.5\s*BLND/)).toBeInTheDocument();
    expect(screen.getByText(/100\s*AQUA/)).toBeInTheDocument();
  });

  it("renders zero state when activities empty", () => {
    render(<RewardSummaryCard activities={[]} />);
    expect(screen.getByText(/\$0/)).toBeInTheDocument();
  });
});

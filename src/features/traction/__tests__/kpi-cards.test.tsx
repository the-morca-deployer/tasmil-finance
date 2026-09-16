import { render, screen } from "@testing-library/react";
import { KpiCards } from "../components/kpi-cards";

const summary = {
  totalTvlUsd: 125_040,
  totalUsers: 15803,
  appWallets: 183,
  questWallets: 151,
  avgApyPercent: 8.4512,
  totalTransactions: 1580,
};

describe("KpiCards", () => {
  it("renders all five formatted KPIs", () => {
    render(<KpiCards summary={summary} isLoading={false} />);

    expect(screen.getByText("Total Value Locked")).toBeInTheDocument();
    expect(screen.getByText("$125.0k")).toBeInTheDocument();
    expect(screen.getByText("App Wallets")).toBeInTheDocument();
    expect(screen.getByText("183")).toBeInTheDocument();
    expect(screen.getByText("Quest Wallets")).toBeInTheDocument();
    expect(screen.getByText("151")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("1,580")).toBeInTheDocument();
    expect(screen.getByText("Avg APY (24h)")).toBeInTheDocument();
    expect(screen.getByText("8.45%")).toBeInTheDocument();
  });

  it("shows five skeleton cards while loading", () => {
    render(<KpiCards summary={undefined} isLoading={true} />);

    expect(screen.getAllByTestId("kpi-skeleton")).toHaveLength(5);
    expect(screen.queryByText("Total Value Locked")).not.toBeInTheDocument();
  });
});

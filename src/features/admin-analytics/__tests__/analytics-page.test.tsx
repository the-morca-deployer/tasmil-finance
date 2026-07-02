import { render, screen } from "@testing-library/react";
import AnalyticsPage from "@/app/admin/(app)/analytics/page";
import { useTransactionsLog } from "@/features/admin-analytics/hooks/use-transactions-log";
import { useTransactionsStats } from "@/features/admin-analytics/hooks/use-transactions-stats";
import { useVolumeTvl } from "@/features/admin-analytics/hooks/use-volume-tvl";
import { useWalletsAnalytics } from "@/features/admin-analytics/hooks/use-wallets-analytics";

jest.mock("@/features/admin-analytics/hooks/use-volume-tvl", () => ({
  useVolumeTvl: jest.fn(),
}));
jest.mock("@/features/admin-analytics/hooks/use-wallets-analytics", () => ({
  useWalletsAnalytics: jest.fn(),
}));
jest.mock("@/features/admin-analytics/hooks/use-transactions-log", () => ({
  useTransactionsLog: jest.fn(),
}));
jest.mock("@/features/admin-analytics/hooks/use-transactions-stats", () => ({
  useTransactionsStats: jest.fn(),
}));

describe("AnalyticsPage", () => {
  beforeEach(() => {
    (useVolumeTvl as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useWalletsAnalytics as jest.Mock).mockReturnValue({ data: { rows: [], total: 0 }, isLoading: false });
    (useTransactionsLog as jest.Mock).mockReturnValue({ data: { rows: [], total: 0 }, isLoading: false });
    (useTransactionsStats as jest.Mock).mockReturnValue({
      data: { totalCount: 0, byType: [] },
      isLoading: false,
    });
  });

  it("renders the date range picker, chart, stats, wallets table, and transactions log", () => {
    render(<AnalyticsPage />);

    expect(screen.getByRole("button", { name: "7d" })).toBeInTheDocument();
    expect(screen.getByText("Volume & TVL")).toBeInTheDocument();
    expect(screen.getByText("Total Transactions")).toBeInTheDocument();
    expect(screen.getByText("No wallets in this period")).toBeInTheDocument();
    expect(screen.getByText("No transactions in this period")).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import AnalyticsPage from "@/app/admin/(app)/analytics/page";
import { useTransactionsLog } from "@/features/admin-analytics/hooks/use-transactions-log";
import { useTransactionsStats } from "@/features/admin-analytics/hooks/use-transactions-stats";
import { useVolumeTvl } from "@/features/admin-analytics/hooks/use-volume-tvl";
import { useWalletsAnalytics } from "@/features/admin-analytics/hooks/use-wallets-analytics";
import { downloadCsvExport } from "@/features/admin-analytics/lib/download-csv";
import { useAdminAuthStore } from "@/store/use-admin-auth";

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
jest.mock("@/features/admin-analytics/lib/download-csv", () => ({
  downloadCsvExport: jest.fn(),
}));
jest.mock("@/store/use-admin-auth", () => ({
  useAdminAuthStore: jest.fn(),
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
    (useAdminAuthStore as unknown as jest.Mock).mockImplementation(
      (selector: (s: { token: string | null }) => unknown) => selector({ token: "test-token" })
    );
    (downloadCsvExport as jest.Mock).mockClear();
  });

  it("renders the date range picker, chart, stats, wallets table, and transactions log", () => {
    render(<AnalyticsPage />);

    expect(screen.getByRole("button", { name: "7d" })).toBeInTheDocument();
    expect(screen.getByText("Volume & TVL")).toBeInTheDocument();
    expect(screen.getByText("Total Transactions")).toBeInTheDocument();
    expect(screen.getByText("No wallets in this period")).toBeInTheDocument();
    expect(screen.getByText("No transactions in this period")).toBeInTheDocument();
  });

  it("includes the encoded search term in the wallets CSV export URL when a filter is active", () => {
    render(<AnalyticsPage />);

    fireEvent.change(screen.getByPlaceholderText("Search by wallet address…"), {
      target: { value: "GABC 123&x=1" },
    });
    const exportButtons = screen.getAllByRole("button", { name: /export csv/i });
    fireEvent.click(exportButtons[0] as HTMLElement);

    expect(downloadCsvExport).toHaveBeenCalledWith(
      expect.stringContaining(`search=${encodeURIComponent("GABC 123&x=1")}`),
      "test-token",
      "wallets.csv"
    );
  });
});

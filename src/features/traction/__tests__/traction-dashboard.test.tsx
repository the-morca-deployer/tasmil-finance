import { fireEvent, render, screen } from "@testing-library/react";
import { TractionDashboard } from "../components/traction-dashboard";
import { useTraction } from "../hooks/use-traction";

jest.mock("../hooks/use-traction", () => ({
  useTraction: jest.fn(),
}));

const payload = {
  summary: {
    totalTvlUsd: 125_040,
    totalUsers: 342,
    avgApyPercent: 8.45,
    totalTransactions: 1580,
  },
  volumeTvl: [{ date: "2026-06-01", volumeUsd: 100, cumulativeTvlUsd: 100 }],
  userGrowth: [{ date: "2026-06-01", newUsers: 3, cumulativeUsers: 8 }],
  txByType: [{ type: "DEPOSIT", count: 12 }],
  publicLedger: {
    state: "FULL",
    network: "mainnet",
    sourceContract: `C${"A".repeat(55)}`,
    range: {
      requestedStartLedger: "90",
      effectiveStartLedger: "90",
      oldestLedger: "80",
      latestLedger: "200",
      truncated: false,
    },
    transactionCount: 12,
    walletCount: 3,
    volumeByVenue: [
      { venue: `C${"B".repeat(55)}`, amountBaseUnits: "200" },
      { venue: `C${"C".repeat(55)}`, amountBaseUnits: "100" },
    ],
    tvlByVenue: [{ venue: `C${"B".repeat(55)}`, balanceBaseUnits: "150" }],
    horizon: {
      endpoint: "https://horizon.stellar.org",
      state: "VERIFIED",
      verifiedTransactions: 12,
    },
    rawEventDigest: "ab".repeat(32),
  },
  reconciliation: {
    cachedTransactionCount: 1580,
    publicLedgerTransactionCount: 12,
    transactionCountDelta: 1568,
    registeredUsers: 342,
    publicLedgerWallets: 3,
  },
  updatedAt: "2026-07-02T12:00:00.000Z",
};

describe("TractionDashboard", () => {
  it("renders header, KPIs, charts, and the updated badge on success", () => {
    (useTraction as jest.Mock).mockReturnValue({
      data: payload,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<TractionDashboard />);

    expect(screen.getByText("Tasmil Traction")).toBeInTheDocument();
    expect(screen.getByText("$125.0k")).toBeInTheDocument();
    expect(screen.getByText("2 venue totals")).toBeInTheDocument();
    expect(screen.getByText("Volume by venue").parentElement).toHaveTextContent("200 base units");
    expect(screen.getByText("Volume by venue").parentElement).toHaveTextContent("100 base units");
    expect(screen.getByText("150 base units")).toBeInTheDocument();
    expect(
      screen.getByText("12", { selector: "[data-ledger-kpi='transactions']" })
    ).toBeInTheDocument();
    expect(screen.getByText("3", { selector: "[data-ledger-kpi='wallets']" })).toBeInTheDocument();
    expect(screen.getByText("Complete RPC range")).toBeInTheDocument();
    expect(screen.getByText(/Ledgers 90–200/)).toBeInTheDocument();
    expect(screen.getByText(/Internal index: 1,580 transactions/)).toBeInTheDocument();
    expect(screen.getByText(/public ledger: 12; delta: 1,568/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: payload.publicLedger.sourceContract })).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/public/contract/${payload.publicLedger.sourceContract}`
    );
    expect(screen.getByText("Volume & TVL — last 90 days")).toBeInTheDocument();
    expect(screen.getByText("User growth — last 90 days")).toBeInTheDocument();
    expect(screen.getByText(/Live data — updated/)).toBeInTheDocument();
  });

  it("distinguishes a real on-chain zero from unavailable Horizon verification", () => {
    (useTraction as jest.Mock).mockReturnValue({
      data: {
        ...payload,
        publicLedger: {
          ...payload.publicLedger,
          state: "PARTIAL",
          range: {
            ...payload.publicLedger.range,
            effectiveStartLedger: "100",
          },
          transactionCount: 0,
          walletCount: 0,
          volumeByVenue: [],
          tvlByVenue: [],
          horizon: {
            ...payload.publicLedger.horizon,
            state: "UNAVAILABLE",
            verifiedTransactions: 0,
          },
        },
        reconciliation: {
          ...payload.reconciliation,
          publicLedgerTransactionCount: 0,
          publicLedgerWallets: 0,
          transactionCountDelta: 1580,
        },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<TractionDashboard />);

    expect(
      screen.getByText("0 base units", { selector: "[data-ledger-kpi='volume']" })
    ).toBeInTheDocument();
    expect(screen.getByText("Partial RPC range")).toBeInTheDocument();
    expect(screen.getByText(/requested 90, available from 100/)).toBeInTheDocument();
    expect(screen.getByText("Horizon verification unavailable")).toBeInTheDocument();
  });

  it("shows skeletons while loading", () => {
    (useTraction as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });

    render(<TractionDashboard />);

    expect(screen.getAllByTestId("kpi-skeleton")).toHaveLength(4);
  });

  it("shows the error state and retries on click", () => {
    const refetch = jest.fn();
    (useTraction as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });

    render(<TractionDashboard />);

    expect(screen.getByText("Data temporarily unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });
});

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
    expect(screen.getByText("Volume & TVL — last 90 days")).toBeInTheDocument();
    expect(screen.getByText("User growth — last 90 days")).toBeInTheDocument();
    expect(screen.getByText(/Live data — updated/)).toBeInTheDocument();
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

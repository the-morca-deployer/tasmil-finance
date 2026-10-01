import { fireEvent, render, screen } from "@testing-library/react";
import type { HistoryRange } from "../hooks/use-portfolio-history";
import { PerformanceChart } from "./performance-chart";

describe("PerformanceChart", () => {
  it("renders placeholder copy when isPlaceholder", () => {
    render(
      <PerformanceChart
        data={[]}
        assetSymbol="XLM"
        range="7d"
        isPlaceholder={true}
        isLoading={false}
        onRangeChange={() => {}}
      />
    );
    expect(screen.getByText(/current vault snapshot/i)).toBeInTheDocument();
  });

  it("renders skeleton when isLoading", () => {
    const { container } = render(
      <PerformanceChart
        data={[]}
        assetSymbol="XLM"
        range="7d"
        isPlaceholder={false}
        isLoading={true}
        onRangeChange={() => {}}
      />
    );
    expect(container.querySelector('[data-testid="chart-skeleton"]')).not.toBeNull();
  });

  it("calls onRangeChange when a range button is clicked", () => {
    const onRangeChange = jest.fn();
    render(
      <PerformanceChart
        data={[]}
        assetSymbol="XLM"
        range="7d"
        isPlaceholder={true}
        isLoading={false}
        onRangeChange={onRangeChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "30d" }));
    expect(onRangeChange).toHaveBeenCalledWith<[HistoryRange]>("30d");
  });

  it("highlights the active range", () => {
    render(
      <PerformanceChart
        data={[]}
        assetSymbol="XLM"
        range="30d"
        isPlaceholder={true}
        isLoading={false}
        onRangeChange={() => {}}
      />
    );
    const active = screen.getByRole("button", { name: "30d" });
    expect(active).toHaveAttribute("aria-pressed", "true");
  });

  it("renders the live portfolio series when snapshots exist", () => {
    render(
      <PerformanceChart
        data={[
          {
            ts: Date.parse("2026-10-01T17:40:00Z"),
            valueUsd: 2.18,
            valueAsset: 9.98,
            walletUsd: 2.18,
            walletAsset: 9.98,
            defiUsd: 0,
            defiAsset: 0,
            assetSymbol: "XLM",
          },
          {
            ts: Date.parse("2026-10-01T17:45:00Z"),
            valueUsd: 2.19,
            valueAsset: 10.004,
            walletUsd: 0,
            walletAsset: 0,
            defiUsd: 2.19,
            defiAsset: 10.004,
            assetSymbol: "XLM",
          },
        ]}
        assetSymbol="XLM"
        range="7d"
        isPlaceholder={false}
        isLoading={false}
        onRangeChange={() => {}}
      />
    );

    expect(screen.getByTestId("portfolio-value-chart")).toBeInTheDocument();
    expect(screen.getByText("10.004 XLM")).toBeInTheDocument();
    expect(screen.getByText("≈ $2.19")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PerformanceSection } from "./performance-section";
import type { HistoryPoint } from "../../hooks/use-portfolio-history";

const data: HistoryPoint[] = Array.from({ length: 7 }).map((_, i) => ({
  ts: Date.parse(`2026-04-${20 + i}T00:00:00Z`),
  valueUsd: 1000 + i * 10,
}));

describe("PerformanceSection", () => {
  it("renders the section header + range pills", () => {
    render(
      <PerformanceSection
        data={data}
        range="7d"
        isLoading={false}
        isPlaceholder={false}
        onRangeChange={jest.fn()}
      />
    );
    expect(screen.getByText(/Performance/)).toBeInTheDocument();
    const pills = screen.getAllByRole("button", { name: "7d" });
    expect(pills.length).toBeGreaterThanOrEqual(1);
  });

  it("emits range changes", async () => {
    const onRangeChange = jest.fn();
    render(
      <PerformanceSection
        data={data}
        range="7d"
        isLoading={false}
        isPlaceholder={false}
        onRangeChange={onRangeChange}
      />
    );
    const pills = screen.getAllByRole("button", { name: "30d" });
    await userEvent.click(pills[0]);
    expect(onRangeChange).toHaveBeenCalledWith("30d");
  });
});

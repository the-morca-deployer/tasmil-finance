import { render, screen } from "@testing-library/react";
import { AprSummaryCard } from "./apr-summary-card";

describe("AprSummaryCard", () => {
  it("renders APR rows, activation date, total deposits", () => {
    render(
      <AprSummaryCard
        blendedApy={0.15}
        currentPositionApr={0.0761}
        currentMarketName="Moonwell"
        activatedAt="2025-02-05T22:28:00Z"
        totalDepositsUsd={49874.8}
      />
    );
    // Computed the same way AprSummaryCard formats it, so this assertion
    // doesn't depend on the test runner's local timezone.
    const expectedDate = new Date("2025-02-05T22:28:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    expect(screen.getByText("Portfolio APY")).toBeInTheDocument();
    expect(screen.getByText("15.00%")).toBeInTheDocument();
    expect(screen.getByText("Moonwell 7.61%")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(expectedDate, "i"))).toBeInTheDocument();
    expect(screen.getByText(/49,874.80/)).toBeInTheDocument();
  });

  it("renders a placeholder instead of a fabricated position line when there is no position", () => {
    render(
      <AprSummaryCard
        blendedApy={0.15}
        currentPositionApr={0}
        currentMarketName="-"
        activatedAt="2025-02-05T22:28:00Z"
        totalDepositsUsd={0}
      />
    );
    const currentPositionLabel = screen.getByText("Current Position APR");
    expect(currentPositionLabel.nextElementSibling).toHaveTextContent("-");
    expect(currentPositionLabel.nextElementSibling?.textContent).not.toMatch(/%/);
  });

  it("renders a placeholder instead of a fabricated activation date when absent", () => {
    render(
      <AprSummaryCard
        blendedApy={0.05}
        currentPositionApr={0.05}
        currentMarketName="Moonwell"
        activatedAt=""
        totalDepositsUsd={0}
      />
    );
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});

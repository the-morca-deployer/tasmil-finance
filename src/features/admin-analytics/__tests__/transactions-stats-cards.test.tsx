import { render, screen } from "@testing-library/react";
import { TransactionsStatsCards } from "../components/transactions-stats-cards";

describe("TransactionsStatsCards", () => {
  it("renders total count and a card per activity type", () => {
    render(
      <TransactionsStatsCards
        stats={{
          totalCount: 7,
          byType: [
            { type: "DEPOSIT", count: 5 },
            { type: "WITHDRAW", count: 2 },
          ],
        }}
        isLoading={false}
      />
    );

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("DEPOSIT")).toBeInTheDocument();
    expect(screen.getByText("WITHDRAW")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    render(<TransactionsStatsCards stats={undefined} isLoading={true} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});

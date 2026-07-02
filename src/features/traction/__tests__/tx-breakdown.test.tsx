import { render, screen } from "@testing-library/react";
import { TxBreakdown } from "../components/tx-breakdown";

describe("TxBreakdown", () => {
  it("renders a row per activity type with formatted counts", () => {
    render(
      <TxBreakdown
        items={[
          { type: "DEPOSIT", count: 1200 },
          { type: "HARVEST", count: 380 },
        ]}
        isLoading={false}
      />
    );

    expect(screen.getByText("DEPOSIT")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("HARVEST")).toBeInTheDocument();
    expect(screen.getByText("380")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<TxBreakdown items={[]} isLoading={false} />);
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    render(<TxBreakdown items={undefined} isLoading={true} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});

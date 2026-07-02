import { fireEvent, render, screen } from "@testing-library/react";
import { WalletsTable } from "../components/wallets-table";

const rows = [
  {
    keeperWalletAddress: "GABC123",
    currentTvlUsd: 500,
    volumeUsd: 1000,
    txCount: 3,
    joinedAt: "2026-01-01T00:00:00.000Z",
    lastActivityAt: "2026-06-01T00:00:00.000Z",
  },
];

describe("WalletsTable", () => {
  it("renders one row per wallet with formatted numbers", () => {
    render(
      <WalletsTable
        rows={rows}
        total={1}
        sort="volume"
        order="desc"
        onSortChange={jest.fn()}
        search=""
        onSearchChange={jest.fn()}
        page={1}
        pageSize={20}
        onPageChange={jest.fn()}
        isLoading={false}
        onExport={jest.fn()}
      />
    );

    expect(screen.getByText("GABC123")).toBeInTheDocument();
    expect(screen.getByText("$1,000")).toBeInTheDocument();
  });

  it("shows an empty state when there are no rows", () => {
    render(
      <WalletsTable
        rows={[]}
        total={0}
        sort="volume"
        order="desc"
        onSortChange={jest.fn()}
        search=""
        onSearchChange={jest.fn()}
        page={1}
        pageSize={20}
        onPageChange={jest.fn()}
        isLoading={false}
        onExport={jest.fn()}
      />
    );

    expect(screen.getByText("No wallets in this period")).toBeInTheDocument();
  });

  it("toggles sort order when clicking the active sort column header", () => {
    const onSortChange = jest.fn();
    render(
      <WalletsTable
        rows={rows}
        total={1}
        sort="volume"
        order="desc"
        onSortChange={onSortChange}
        search=""
        onSearchChange={jest.fn()}
        page={1}
        pageSize={20}
        onPageChange={jest.fn()}
        isLoading={false}
        onExport={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /volume/i }));

    expect(onSortChange).toHaveBeenCalledWith("volume", "asc");
  });

  it("calls onExport when the Export CSV button is clicked", () => {
    const onExport = jest.fn();
    render(
      <WalletsTable
        rows={rows}
        total={1}
        sort="volume"
        order="desc"
        onSortChange={jest.fn()}
        search=""
        onSearchChange={jest.fn()}
        page={1}
        pageSize={20}
        onPageChange={jest.fn()}
        isLoading={false}
        onExport={onExport}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));

    expect(onExport).toHaveBeenCalledTimes(1);
  });
});

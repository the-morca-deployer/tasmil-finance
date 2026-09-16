import { fireEvent, render, screen } from "@testing-library/react";
import type { FeePage as FeePageData } from "../api/adapters";
import { useFeeEvents } from "../api/use-fee-events";
import { FeePage } from "./fee-page";

jest.mock("../api/use-fee-events", () => ({ useFeeEvents: jest.fn() }));

const mockUseFeeEvents = useFeeEvents as jest.MockedFunction<typeof useFeeEvents>;
const txHash = "ab".repeat(32);
const feeData: FeePageData = {
  network: "mainnet",
  sourceContract: "CFEE",
  readRange: {
    requestedStartLedger: "64000000",
    effectiveStartLedger: "64000000",
    oldestLedger: "63000000",
    latestLedger: "64422326",
    partial: false,
  },
  events: ["perf_fee", "exec_fee", "settle"].map((type, index) => ({
    id: `event-${index}`,
    type: type as "perf_fee" | "exec_fee" | "settle",
    network: "mainnet",
    sourceContract: "CFEE",
    ledger: String(64_400_000 + index),
    ledgerClosedAt: "2026-09-16T00:00:00.000Z",
    wallet: "GWALLET",
    strategy: "CSTRATEGY",
    amount: String(1000 + index),
    details: [],
    txHash,
    txStatus: "CONFIRMED",
    explorerUrl: `https://stellar.expert/explorer/public/tx/${txHash}`,
  })),
  nextCursor: "next-page",
};

function state(overrides: Record<string, unknown> = {}) {
  return {
    data: feeData,
    isLoading: false,
    error: null,
    hasPrevious: false,
    nextPage: jest.fn(),
    previousPage: jest.fn(),
    refetch: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useFeeEvents>;
}

describe("FeePage", () => {
  beforeEach(() => mockUseFeeEvents.mockReturnValue(state()));

  it("renders loading, empty and error states", () => {
    mockUseFeeEvents.mockReturnValueOnce(state({ data: undefined, isLoading: true }));
    const { rerender } = render(<FeePage />);
    expect(screen.getByRole("status")).toHaveTextContent(/reading stellar fee events/i);

    mockUseFeeEvents.mockReturnValueOnce(
      state({ data: { ...feeData, events: [], nextCursor: null } })
    );
    rerender(<FeePage />);
    expect(screen.getByText(/no confirmed fee events/i)).toBeInTheDocument();

    mockUseFeeEvents.mockReturnValueOnce(state({ data: undefined, error: new Error("RPC down") }));
    rerender(<FeePage />);
    expect(screen.getByText(/fee evidence unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders every fee type with exact chain provenance", () => {
    render(<FeePage />);
    expect(screen.getByText("Performance fee")).toBeInTheDocument();
    expect(screen.getByText("Execution fee")).toBeInTheDocument();
    expect(screen.getByText("Settlement")).toBeInTheDocument();
    expect(screen.getByText(/ledger range 64000000–64422326/i)).toBeInTheDocument();
    expect(screen.getAllByText("Confirmed")).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: /view transaction/i })[0]).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/public/tx/${txHash}`
    );
    expect(screen.getAllByText("1000")[0]).toBeInTheDocument();
    expect(screen.getByText(/source contract cfee/i)).toBeInTheDocument();
  });

  it("moves through cursor pages without inventing offsets", () => {
    const nextPage = jest.fn();
    mockUseFeeEvents.mockReturnValue(state({ nextPage }));
    render(<FeePage />);
    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(nextPage).toHaveBeenCalledWith("next-page");
  });

  it("labels a pruned RPC range as partial", () => {
    mockUseFeeEvents.mockReturnValue(
      state({ data: { ...feeData, readRange: { ...feeData.readRange, partial: true } } })
    );
    render(<FeePage />);
    expect(screen.getByText(/partial ledger range/i)).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import type { ActivityPage } from "../api/adapters";
import { useActivityFeed } from "../api/use-activity-feed";
import { ActivityFeed } from "./activity-feed";

jest.mock("../api/use-activity-feed", () => ({ useActivityFeed: jest.fn() }));

const mockUseActivityFeed = useActivityFeed as jest.MockedFunction<typeof useActivityFeed>;
const txHash = "cd".repeat(32);
const baseItem = {
  accountId: "vault-1",
  streamId: "decision:1",
  seq: "1",
  decisionId: "decision-1",
  network: "testnet" as const,
  latestLedger: "12345",
  createdAt: "2026-09-16T00:00:00.000Z",
};
const activityData: ActivityPage = {
  items: [
    {
      ...baseItem,
      id: "policy",
      entryType: "DECISION",
      payload: { decision: "DECLINED", rule: "POLICY", reason: "OVER_CEILING" },
      txHash: null,
      txStatus: null,
      explorerUrl: null,
    },
    {
      ...baseItem,
      id: "edge",
      entryType: "DECISION",
      payload: { decision: "DECLINED", rule: "NET_EDGE" },
      txHash: null,
      txStatus: null,
      explorerUrl: null,
    },
    {
      ...baseItem,
      id: "price",
      entryType: "REFUSAL",
      payload: { decision: "REFUSED", rule: "PRICE_INTEGRITY" },
      txHash: null,
      txStatus: null,
      explorerUrl: null,
    },
    {
      ...baseItem,
      id: "unknown",
      entryType: "UNKNOWN",
      payload: { decision: "UNKNOWN", rule: "EXECUTION" },
      txHash,
      txStatus: "UNKNOWN",
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
    },
    {
      ...baseItem,
      id: "confirmed",
      entryType: "CONFIRMATION",
      payload: { decision: "CONFIRMED", rule: "EXECUTION" },
      txHash,
      txStatus: "CONFIRMED",
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
    },
  ],
  nextCursor: "next-cursor",
};

function state(overrides: Record<string, unknown> = {}) {
  return {
    walletConnected: true,
    accountId: "vault-1",
    data: activityData,
    isLoading: false,
    error: null,
    hasPrevious: false,
    nextPage: jest.fn(),
    previousPage: jest.fn(),
    refetch: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useActivityFeed>;
}

describe("ActivityFeed", () => {
  beforeEach(() => mockUseActivityFeed.mockReturnValue(state()));

  it("renders loading, empty and error states", () => {
    mockUseActivityFeed.mockReturnValueOnce(state({ data: undefined, isLoading: true }));
    const { rerender } = render(<ActivityFeed />);
    expect(screen.getByRole("status")).toHaveTextContent(/loading policy evidence/i);

    mockUseActivityFeed.mockReturnValueOnce(
      state({ data: { items: [], nextCursor: null } satisfies ActivityPage })
    );
    rerender(<ActivityFeed />);
    expect(screen.getByText(/no policy activity yet/i)).toBeInTheDocument();

    mockUseActivityFeed.mockReturnValueOnce(
      state({ data: undefined, error: new Error("database unavailable") })
    );
    rerender(<ActivityFeed />);
    expect(screen.getByText(/activity evidence unavailable/i)).toBeInTheDocument();
  });

  it("labels policy, Net-Edge, price, UNKNOWN and confirmed outcomes", () => {
    render(<ActivityFeed />);
    expect(screen.getByText("Policy rejected")).toBeInTheDocument();
    expect(screen.getByText("Net-Edge declined")).toBeInTheDocument();
    expect(screen.getByText("Price evidence refused")).toBeInTheDocument();
    expect(screen.getByText("Submission unknown")).toBeInTheDocument();
    expect(screen.getByText("Execution confirmed")).toBeInTheDocument();
  });

  it("links only chain-bearing rows to transactions", () => {
    render(<ActivityFeed />);
    expect(screen.getAllByText(/no transaction submitted/i)).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: /replay evidence/i })[0]).toHaveAttribute(
      "href",
      "/activity/decision-1"
    );
    expect(screen.getAllByRole("link", { name: /view transaction/i })).toHaveLength(2);
  });

  it("uses backend cursors for pagination", () => {
    const nextPage = jest.fn();
    mockUseActivityFeed.mockReturnValue(state({ nextPage }));
    render(<ActivityFeed />);
    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(nextPage).toHaveBeenCalledWith("next-cursor");
  });
});

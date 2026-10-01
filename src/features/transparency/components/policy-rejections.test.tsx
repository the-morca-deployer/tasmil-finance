import { fireEvent, render, screen } from "@testing-library/react";
import { type PolicyRejection, usePolicyRejections } from "../api/use-policy-rejections";
import { PolicyRejections } from "./policy-rejections";

jest.mock("../api/use-policy-rejections", () => ({ usePolicyRejections: jest.fn() }));

const mockHook = usePolicyRejections as jest.Mock;
const TX = "d".repeat(64);

const item = (patch: Partial<PolicyRejection>): PolicyRejection => ({
  id: "r1",
  kind: "NET_EDGE_DECLINE",
  entryType: "DECLINE",
  decisionId: "d1",
  code: "NET_EDGE",
  reason: "Gain $0.04 is below cost $0.11",
  keeperWallet: "CAWBQPESFRFTIKBARVYIX6SCQV6B5FDM6ZCNVX6E5ZEYLKPN7T4IUAQ6",
  network: "mainnet",
  latestLedger: "64717849",
  txHash: null,
  explorerUrl: null,
  createdAt: "2026-10-01T10:00:00.000Z",
  ...patch,
});

function state(items: PolicyRejection[], patch: Record<string, unknown> = {}) {
  return {
    data: { pages: [{ items, nextCursor: null }] },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    ...patch,
  };
}

describe("PolicyRejections", () => {
  it("lists each rejection kind with its reason, vault and tx link", () => {
    mockHook.mockReturnValue(
      state([
        item({}),
        item({
          id: "r2",
          kind: "POLICY_REJECTED",
          entryType: "FAILED",
          reason: null,
          code: null,
          txHash: TX,
          explorerUrl: `https://stellar.expert/explorer/public/tx/${TX}`,
        }),
      ])
    );
    render(<PolicyRejections />);

    expect(screen.getByText("Net-Edge declined")).toBeInTheDocument();
    expect(screen.getByText("Gain $0.04 is below cost $0.11")).toBeInTheDocument();
    expect(screen.getByText("Rejected on-chain")).toBeInTheDocument();
    expect(screen.getByText("Policy Guard reverted the transaction")).toBeInTheDocument();
    expect(screen.getAllByText(/Vault CAWB\.\.\.UAQ6/)).toHaveLength(2);
    expect(screen.getByRole("link", { name: /view transaction/i })).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/public/tx/${TX}`
    );
    expect(screen.getByText("Blocked before submission")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    mockHook.mockReturnValue(state([]));
    render(<PolicyRejections />);
    expect(screen.getByText("No policy rejections recorded yet.")).toBeInTheDocument();
  });

  it("offers retry on error", () => {
    const refetch = jest.fn();
    mockHook.mockReturnValue(state([], { data: undefined, isError: true, refetch }));
    render(<PolicyRejections />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });
});

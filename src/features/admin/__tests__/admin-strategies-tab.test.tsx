import { fireEvent, render, screen } from "@testing-library/react";
import { StrategiesTab } from "@/features/admin-strategies/components/strategies-tab";
import {
  useAdminStrategies,
  useApproveStrategy,
  useRejectStrategy,
} from "@/features/admin-strategies/hooks/use-admin-marketplace";

jest.mock("@/features/admin-strategies/hooks/use-admin-marketplace", () => ({
  useAdminStrategies: jest.fn(),
  useApproveStrategy: jest.fn(),
  useRejectStrategy: jest.fn(),
}));
jest.mock("@/shared/lib/admin-download", () => ({ adminDownload: jest.fn() }));

const mockStrategies = useAdminStrategies as jest.Mock;
const mockApprove = useApproveStrategy as jest.Mock;
const mockReject = useRejectStrategy as jest.Mock;

const rows = [
  {
    id: "s1",
    name: "Alpha",
    slug: "alpha",
    status: "PENDING",
    publisherName: "Pub",
    publisherAddress: "GPUB",
    baseAsset: "USDC",
    riskTier: "BALANCED",
    perfFeeBps: 500,
    keeperWalletAddress: "CKEEPER",
    publishTxHash: "tx1",
    tvlUsd: 1000,
    userCount: 3,
    publishedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "s2",
    name: "Beta",
    slug: "beta",
    status: "PUBLISHED",
    publisherName: null,
    publisherAddress: null,
    baseAsset: "XLM",
    riskTier: "AGGRESSIVE",
    perfFeeBps: 1000,
    keeperWalletAddress: null,
    publishTxHash: null,
    tvlUsd: 250.5,
    userCount: 1,
    publishedAt: "2026-06-15T00:00:00.000Z",
  },
];

describe("StrategiesTab", () => {
  const approveMutate = jest.fn();
  const rejectMutate = jest.fn();

  beforeEach(() => {
    approveMutate.mockReset();
    rejectMutate.mockReset();
    mockStrategies.mockReturnValue({ data: rows, isLoading: false, isError: false });
    mockApprove.mockReturnValue({ mutate: approveMutate, isPending: false });
    mockReject.mockReturnValue({ mutate: rejectMutate, isPending: false });
  });

  it("renders one row per strategy with status badge", () => {
    render(<StrategiesTab />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getAllByText("PENDING")).toHaveLength(2); // filter button + badge
    expect(screen.getAllByText("PUBLISHED")).toHaveLength(2); // filter button + badge
  });

  it("shows approve/reject only on PENDING rows and confirms before mutating", () => {
    render(<StrategiesTab />);
    expect(screen.getAllByRole("button", { name: /approve/i })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    // confirm dialog appears
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(approveMutate).toHaveBeenCalledWith("s1");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { RankRevealGate } from "../RankRevealGate";

const mutate = jest.fn();
const mockGetMe = jest.fn();

jest.mock("@/gen-quest", () => ({
  useSeasonsControllerMyResult: () => mockGetMe(),
  useSeasonsControllerRevealAck: () => ({ mutate, isPending: false }),
}));
jest.mock("@/features/quest/store/use-quest-auth", () => ({
  useQuestAuthStore: (sel: (s: { isAuthenticated: boolean }) => unknown) =>
    sel({ isAuthenticated: true }),
}));

const result = {
  season: { id: "s1", name: "June 2026", status: "ENDED" },
  finalRank: 1,
  finalPoints: 5000,
  usdcReward: "50",
  pointsReward: 5000,
  badge: "gold",
  payoutStatus: "PENDING",
  revealed: false,
};

describe("RankRevealGate", () => {
  beforeEach(() => {
    mutate.mockReset();
    mockGetMe.mockReset();
  });

  it("shows RankReveal once when revealed=false, then acks and hides", () => {
    mockGetMe.mockReturnValue({ data: { data: result } });
    render(<RankRevealGate />);
    expect(screen.getByText(/June 2026/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /claim/i }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/June 2026/i)).not.toBeInTheDocument();
  });

  it("renders nothing when already revealed", () => {
    mockGetMe.mockReturnValue({ data: { data: { ...result, revealed: true } } });
    const { container } = render(<RankRevealGate />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no result", () => {
    mockGetMe.mockReturnValue({ data: { data: null } });
    const { container } = render(<RankRevealGate />);
    expect(container).toBeEmptyDOMElement();
  });
});

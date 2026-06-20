import { render, screen } from "@testing-library/react";
import { LeaderboardPage } from "./leaderboard-page";

const mockUseCurrent = jest.fn();
const mockUseLeaderboard = jest.fn();

jest.mock("@/gen-quest", () => ({
  useSeasonsControllerCurrent: () => mockUseCurrent(),
  useSeasonsControllerLeaderboard: () => mockUseLeaderboard(),
}));

const activeSeason = {
  data: {
    data: {
      id: "s1",
      name: "June 2026",
      status: "ACTIVE",
      startAt: "2026-06-01T00:00:00.000Z",
      endAt: "2026-12-01T00:00:00.000Z",
      prizePoolUsdc: "80",
      rankRewards: [
        { rankFrom: 1, rankTo: 1, usdc: "50", points: 5000 },
        { rankFrom: 2, rankTo: 2, usdc: "20", points: 3000 },
        { rankFrom: 3, rankTo: 3, usdc: "10", points: 2000 },
      ],
    },
  },
};

const standings = {
  data: {
    data: [
      { rank: 1, userId: "u1", username: "alice", walletAddress: "GA1", seasonPoints: 18420 },
      { rank: 2, userId: "u2", username: "bob", walletAddress: "GB2", seasonPoints: 16110 },
      { rank: 3, userId: "u3", username: "carol", walletAddress: "GC3", seasonPoints: 14980 },
      { rank: 4, userId: "u4", username: "dave", walletAddress: "GD4", seasonPoints: 9240 },
      { rank: 5, userId: "u5", username: "erin", walletAddress: "GE5", seasonPoints: 8710 },
    ],
  },
};

describe("LeaderboardPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-20T00:00:00.000Z"));
    mockUseCurrent.mockReset();
    mockUseLeaderboard.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it("renders podium, banner, and standings for an active season", () => {
    mockUseCurrent.mockReturnValue({ data: activeSeason.data, isLoading: false });
    mockUseLeaderboard.mockReturnValue({ data: standings.data, isLoading: false });
    render(<LeaderboardPage />);
    expect(screen.getByText("June 2026")).toBeInTheDocument();
    expect(screen.getByTestId("podium-rank-1")).toBeInTheDocument();
    // prize pool figure
    expect(screen.getByText("80")).toBeInTheDocument();
    // rank >= 4 in standings
    expect(screen.getByText("dave")).toBeInTheDocument();
    expect(screen.getByText("erin")).toBeInTheDocument();
  });

  it("shows a no-active-season message when current is null", () => {
    mockUseCurrent.mockReturnValue({ data: { data: null }, isLoading: false });
    mockUseLeaderboard.mockReturnValue({ data: { data: [] }, isLoading: false });
    render(<LeaderboardPage />);
    expect(screen.getByText(/no active season/i)).toBeInTheDocument();
  });
});

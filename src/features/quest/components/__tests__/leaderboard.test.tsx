import { render, screen } from "@testing-library/react";
import Leaderboard from "../Leaderboard";

jest.mock("@/gen-quest/hooks", () => ({
  useAnalyticsControllerGlobalLeaderboard: () => ({
    data: {
      data: [
        { rank: 1, username: "stellar_nomad", walletAddress: "GDEM...F3A4", totalPoints: 14000 },
      ],
    },
    isLoading: false,
  }),
  useAnalyticsControllerStreakLeaderboard: () => ({ data: { data: [] }, isLoading: false }),
  useSeasonsControllerCurrent: () => ({
    data: { data: { name: "June 2026", prizePoolUsdc: "80" } },
  }),
  useSeasonsControllerMyResult: () => ({ data: undefined }),
}));

describe("Leaderboard", () => {
  it("renders the Points and Streak toggle", () => {
    render(<Leaderboard />);
    expect(screen.getByRole("tab", { name: /points/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /streak/i })).toBeInTheDocument();
  });
});

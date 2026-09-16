import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  // Leaderboard also calls useSeasonsControllerLeaderboard (added after this
  // mock was written). It reads `const { data } = ...`, so undefined is safe.
  useSeasonsControllerLeaderboard: () => ({ data: undefined }),
}));

describe("Leaderboard", () => {
  it("switches the board between the Points and Streak metrics", async () => {
    const user = userEvent.setup();
    render(<Leaderboard />);

    // The toggle is a pair of plain <button>s, not Radix role="tab".
    const points = screen.getByRole("button", { name: /^points$/i });
    const streak = screen.getByRole("button", { name: /^streak$/i });

    // Points is the default metric and the heading tracks the selection.
    expect(screen.getByText(/points leaderboard/i)).toBeInTheDocument();

    await user.click(streak);
    expect(screen.getByText(/streak leaderboard/i)).toBeInTheDocument();

    await user.click(points);
    expect(screen.getByText(/points leaderboard/i)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { QuestNav } from "./QuestNav";

jest.mock("next/navigation", () => ({ usePathname: () => "/quest/campaigns" }));
jest.mock("@/gen-quest", () => ({
  useUsersControllerGetMe: () => ({
    data: { data: { totalPoints: 360, loginStreak: 1, walletAddress: "GABC...XYZ" } },
  }),
}));
jest.mock("../store/use-quest-auth", () => ({
  useQuestAuthStore: () => ({ user: { walletAddress: "GABCDEF...WXYZ" }, isAuthenticated: true }),
}));

describe("QuestNav", () => {
  it("renders nav links with production routes", () => {
    render(<QuestNav />);
    expect(screen.getByRole("link", { name: /Explore/i })).toHaveAttribute("href", "/quest/quest");
    expect(screen.getByRole("link", { name: /Campaigns/i })).toHaveAttribute(
      "href",
      "/quest/campaigns",
    );
    expect(screen.getByRole("link", { name: /Leaderboard/i })).toHaveAttribute(
      "href",
      "/quest/leaderboard",
    );
  });
  it("marks Campaigns active on /quest/campaigns", () => {
    render(<QuestNav />);
    expect(screen.getByRole("link", { name: /Campaigns/i }).className).toContain("active");
  });
  it("shows points and streak from /me", () => {
    render(<QuestNav />);
    expect(screen.getByText("360")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

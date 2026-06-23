import { fireEvent, render, screen } from "@testing-library/react";
import { QuestNav } from "./QuestNav";

const dailyMutate = jest.fn();
const checkInState = { hasCheckedIn: false };

jest.mock("next/navigation", () => ({ usePathname: () => "/quest/campaigns" }));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("../lib/kubb-config", () => ({ withAuth: {} }));
jest.mock("@/gen-quest", () => ({
  useUsersControllerGetMe: () => ({
    data: { data: { totalPoints: 360, loginStreak: 1, walletAddress: "GABC...XYZ" } },
  }),
  useUsersControllerGetCheckInStatus: () => ({
    data: { data: { hasCheckedIn: checkInState.hasCheckedIn } },
    refetch: jest.fn(),
  }),
  useUsersControllerDailyLogin: () => ({ mutate: dailyMutate, isPending: false }),
  usersControllerGetMeQueryKey: () => ["me"],
}));
jest.mock("../store/use-quest-auth", () => ({
  useQuestAuthStore: () => ({ user: { walletAddress: "GABCDEF...WXYZ" }, isAuthenticated: true }),
}));

describe("QuestNav", () => {
  beforeEach(() => {
    dailyMutate.mockReset();
    checkInState.hasCheckedIn = false;
  });

  it("renders nav links with production routes", () => {
    render(<QuestNav />);
    expect(screen.getByRole("link", { name: /Explore/i })).toHaveAttribute("href", "/quest/quest");
    expect(screen.getByRole("link", { name: /Campaigns/i })).toHaveAttribute(
      "href",
      "/quest/campaigns"
    );
    expect(screen.getByRole("link", { name: /Leaderboard/i })).toHaveAttribute(
      "href",
      "/quest/leaderboard"
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
  it("checks in when the streak pill is clicked", () => {
    render(<QuestNav />);
    fireEvent.click(screen.getByRole("button", { name: /daily check-in/i }));
    expect(dailyMutate).toHaveBeenCalledTimes(1);
  });
  it("disables check-in once already checked in", () => {
    checkInState.hasCheckedIn = true;
    render(<QuestNav />);
    const pill = screen.getByRole("button", { name: /checked in today/i });
    expect(pill).toBeDisabled();
  });
});

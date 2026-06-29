import { fireEvent, render, screen } from "@testing-library/react";
import { QuestNav } from "./QuestNav";

const completeMutate = jest.fn();
const missionState = { completedToday: false };

jest.mock("next/navigation", () => ({ usePathname: () => "/quest/campaigns" }));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("../lib/kubb-config", () => ({ withAuth: {}, $: {} }));
jest.mock("@/gen-quest", () => ({
  useUsersControllerGetMe: () => ({
    data: { data: { totalPoints: 360, loginStreak: 1, walletAddress: "GABC...XYZ" } },
  }),
  useDailyMissionsControllerComplete: () => ({ mutate: completeMutate, isPending: false }),
  useDailyMissionsControllerList: () => ({
    data: { data: [{ code: "daily-login", completedToday: missionState.completedToday }] },
  }),
  dailyMissionsControllerListQueryKey: () => ["dm"],
  usersControllerGetMeQueryKey: () => ["me"],
}));
jest.mock("../context/wallet-context", () => ({
  useWallet: () => ({ connect: jest.fn(), disconnect: jest.fn(), isAuthenticating: false }),
}));
jest.mock("../store/use-quest-auth", () => ({
  useQuestAuthStore: () => ({ user: { walletAddress: "GABCDEF...WXYZ" }, isAuthenticated: true }),
}));

describe("QuestNav", () => {
  beforeEach(() => {
    completeMutate.mockReset();
    missionState.completedToday = false;
  });

  it("renders nav links with production routes", () => {
    render(<QuestNav />);
    expect(screen.getByRole("link", { name: /Explore/i })).toHaveAttribute("href", "/quest");
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
    // Active link uses text-[var(--text)]; inactive links use text-[var(--muted)]
    expect(screen.getByRole("link", { name: /Campaigns/i }).className).toContain(
      "text-[var(--text)]"
    );
  });
  it("shows points and streak from /me", () => {
    render(<QuestNav />);
    expect(screen.getByText("360")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
  it("checks in when the streak pill is clicked", () => {
    render(<QuestNav />);
    fireEvent.click(screen.getByRole("button", { name: /daily check-in/i }));
    expect(completeMutate).toHaveBeenCalledTimes(1);
    expect(completeMutate).toHaveBeenCalledWith({ code: "daily-login" });
  });
  it("disables check-in once already checked in", () => {
    missionState.completedToday = true;
    render(<QuestNav />);
    const pill = screen.getByRole("button", { name: /checked in today/i });
    expect(pill).toBeDisabled();
  });
});

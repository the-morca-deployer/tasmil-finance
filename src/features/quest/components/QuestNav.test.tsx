import { fireEvent, render, screen } from "@testing-library/react";
import { QuestNav } from "./QuestNav";

const dailyLoginMutate = jest.fn();
const checkInState = { hasCheckedIn: false };

jest.mock("next/navigation", () => ({ usePathname: () => "/quest/campaigns" }));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useQuery: () => ({ data: "0", isLoading: false }),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));
jest.mock("../lib/kubb-config", () => ({ withAuth: {}, $: { query: {} } }));
jest.mock("@/gen-quest", () => ({
  useUsersControllerGetMe: () => ({
    data: { totalPoints: 360, loginStreak: 1, walletAddress: "GABC...XYZ" },
  }),
  useUsersControllerGetCheckInStatus: () => ({
    data: { hasCheckedIn: checkInState.hasCheckedIn },
    refetch: jest.fn(),
  }),
  useUsersControllerDailyLogin: () => ({ mutate: dailyLoginMutate, isPending: false }),
  usersControllerGetMeQueryKey: () => ["me"],
  useNotificationsControllerList: () => ({
    data: { data: { items: [], total: 0 } },
    isLoading: false,
  }),
}));
jest.mock("../context/wallet-context", () => ({
  useWallet: () => ({ connect: jest.fn(), disconnect: jest.fn(), isAuthenticating: false }),
}));
jest.mock("../store/use-quest-auth", () => ({
  useQuestAuthStore: () => ({ user: { walletAddress: "GABCDEF...WXYZ" }, isAuthenticated: true }),
}));

describe("QuestNav", () => {
  beforeEach(() => {
    dailyLoginMutate.mockReset();
    checkInState.hasCheckedIn = false;
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
    expect(screen.getByRole("link", { name: /Campaigns/i }).className).toContain(
      "text-[var(--text)]"
    );
  });
  it("shows points and streak from /me", () => {
    checkInState.hasCheckedIn = true; // streak number is shown in the checked-in pill ("1")
    render(<QuestNav />);
    expect(screen.getByText("360")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
  it("checks in when the streak pill is clicked", () => {
    render(<QuestNav />);
    fireEvent.click(screen.getByRole("button", { name: /daily check-in/i }));
    expect(dailyLoginMutate).toHaveBeenCalledTimes(1);
    expect(dailyLoginMutate).toHaveBeenCalledWith(undefined);
  });
  it("disables check-in once already checked in", () => {
    checkInState.hasCheckedIn = true;
    render(<QuestNav />);
    const pill = screen.getByRole("button", { name: /checked in today/i });
    expect(pill).toBeDisabled();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { QuestNav } from "./QuestNav";

const claimMutate = jest.fn();
const claimState = { completedToday: false };

jest.mock("next/navigation", () => ({ usePathname: () => "/quest/campaigns" }));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));
jest.mock("../lib/kubb-config", () => ({ withAuth: {}, $: { query: {} } }));
jest.mock("@/gen-quest", () => ({
  useUsersControllerGetMe: () => ({
    data: { data: { totalPoints: 360, loginStreak: 1, walletAddress: "GABC...XYZ" } },
  }),
  useCampaignsControllerFindAll: () => ({
    data: {
      data: [
        {
          id: "campaign-daily-001",
          isDaily: true,
          title: "Daily Missions",
        },
      ],
    },
  }),
  useCampaignsControllerFindOne: () => ({
    data: {
      data: {
        id: "campaign-daily-001",
        isDaily: true,
        tasks: [
          {
            id: "task-login-001",
            type: "LOGIN_CHECKIN",
            title: "Daily Login",
            pointReward: 10,
          },
        ],
      },
    },
  }),
  useTasksControllerGetClaimStatus: () => ({
    data: { data: { completedToday: claimState.completedToday, claimed: false } },
  }),
  useTasksControllerClaimTask: () => ({ mutate: claimMutate, isPending: false }),
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
    claimMutate.mockReset();
    claimState.completedToday = false;
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
    render(<QuestNav />);
    expect(screen.getByText("360")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
  it("checks in when the streak pill is clicked", () => {
    render(<QuestNav />);
    fireEvent.click(screen.getByRole("button", { name: /daily check-in/i }));
    expect(claimMutate).toHaveBeenCalledTimes(1);
    expect(claimMutate).toHaveBeenCalledWith({ id: "task-login-001" });
  });
  it("disables check-in once already checked in", () => {
    claimState.completedToday = true;
    render(<QuestNav />);
    const pill = screen.getByRole("button", { name: /checked in today/i });
    expect(pill).toBeDisabled();
  });
});

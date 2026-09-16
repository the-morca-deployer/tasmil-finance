import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "../Profile";

// Profile keeps the active tab in the URL (?tab=<slug>) and switches it with
// router.replace, so the suite needs a router whose replace it can observe.
const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({
    isAuthenticated: true,
    address: "GDPI...TKEF",
    points: 10,
    user: {
      username: "user_3abe7ed8",
      tier: "COHORT_4",
      totalPoints: 10,
      loginStreak: 1,
      referralCode: "46676f23",
    },
    connect: jest.fn(),
  }),
}));
jest.mock("@/features/quest/store/use-quest-auth", () => ({
  useQuestAuthStore: () => ({ updateUser: jest.fn() }),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: jest.fn(), refetchQueries: jest.fn() }),
}));
jest.mock("@/gen-quest/hooks", () => ({
  useSocialAccountsControllerFindAll: () => ({ data: { data: [] }, refetch: jest.fn() }),
  useSocialAccountsControllerLinkAccount: () => ({ mutate: jest.fn(), isPending: false }),
  useSocialAccountsControllerUnlinkAccount: () => ({ mutate: jest.fn(), isPending: false }),
  useUsersControllerUpdateProfile: () => ({ mutate: jest.fn(), isPending: false }),
  useUsersControllerGetMyCampaigns: () => ({ data: { data: [] }, isLoading: false }),
  useReferralControllerGetMyReferral: () => ({ data: undefined }),
  useUsersControllerGetReferrals: () => ({ data: { data: [] } }),
  useUsersControllerGetPointsHistory: () => ({ data: { data: [] } }),
  // Hooks Profile gained after this mock was written:
  useReferralControllerGetTree: () => ({ data: undefined, isLoading: false }),
  useTierRewardsControllerList: () => ({ data: undefined }),
  useTierRewardsControllerClaim: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
}));

describe("Profile", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("renders the four profile tabs and routes to the tab slug on click", async () => {
    const user = userEvent.setup();
    render(<Profile />);

    // The tabs are plain <button>s inside a <nav>, not Radix role="tab".
    const names = [/overview/i, /my quests/i, /^referrals$/i, /social accounts/i];
    for (const name of names) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }

    // Overview is the default panel. The active tab lives in the URL, so a click
    // is a router.replace to the tab slug rather than local state.
    expect(screen.getByRole("heading", { name: /^overview$/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /social accounts/i }));
    expect(replace).toHaveBeenCalledWith("?tab=social", { scroll: false });
  });
});

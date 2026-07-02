import { render, screen } from "@testing-library/react";
import Profile from "../Profile";

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
  useUsersControllerSetEmail: () => ({ mutate: jest.fn(), isPending: false }),
  useUsersControllerGetMyCampaigns: () => ({ data: { data: [] }, isLoading: false }),
  useReferralControllerGetMyReferral: () => ({ data: undefined }),
  useUsersControllerGetReferrals: () => ({ data: { data: [] } }),
  useUsersControllerGetPointsHistory: () => ({ data: { data: [] } }),
}));

describe("Profile", () => {
  it("renders the four profile tabs", () => {
    render(<Profile />);
    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /my quests/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /referrals/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /social accounts/i })).toBeInTheDocument();
  });
});

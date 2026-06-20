import { fireEvent, render, screen } from "@testing-library/react";
import CampaignDetail from "./CampaignDetail";

const claimMutate = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "c1" }),
}));

jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({
    isConnected: true,
    isAuthenticated: true,
    address: "G...",
    connect: jest.fn(),
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn(), refetchQueries: jest.fn() }),
}));

jest.mock("@/gen-quest/hooks", () => {
  const noopMutation = () => ({ mutate: jest.fn(), isPending: false });
  return {
  useCampaignsControllerFindOne: () => ({
    data: {
      data: {
        campaign: {
          id: "c1",
          title: "T",
          description: "d",
          status: "ongoing",
          rewardPoints: 100,
          questersCount: 3,
          tasks: [{ id: "t1", title: "Onchain Swap", description: "d", type: "onchain" }],
        },
        participation: { id: "p1" },
        meta: { avatars: [] },
      },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useCampaignsControllerJoinCampaign: noopMutation,
  useCampaignsControllerGetNotJoinedCampaigns: () => ({ data: undefined, isLoading: false }),
  useCampaignsControllerClaimCampaign: noopMutation,
  useTasksControllerVerifyTask: noopMutation,
  useTasksControllerGetStatus: () => ({
    data: { data: { status: "COMPLETED", pointsEarned: 50 } },
    refetch: jest.fn(),
  }),
  useTasksControllerGetClaimStatus: () => ({
    data: { data: { claimed: false } },
    refetch: jest.fn(),
  }),
  useTasksControllerClaimTask: () => ({ mutate: claimMutate, isPending: false }),
  useSocialAccountsControllerFindAll: () => ({ data: { data: [] }, refetch: jest.fn() }),
  useSocialAccountsControllerLinkAccount: noopMutation,
  useUsersControllerGetMe: () => ({ data: undefined, refetch: jest.fn() }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
  };
});

describe("CampaignDetail task transitions", () => {
  it("COMPLETED+unclaimed → Claim button claims on click", () => {
    render(<CampaignDetail />);
    // Expand the task to reveal its action button.
    fireEvent.click(screen.getByText("Onchain Swap"));
    const claim = screen.getByRole("button", { name: /Claim 50 PTS/i });
    fireEvent.click(claim);
    expect(claimMutate).toHaveBeenCalled();
  });
});

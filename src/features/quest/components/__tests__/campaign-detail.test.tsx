import { render, screen } from "@testing-library/react";
import CampaignDetail from "../CampaignDetail";

jest.mock("next/navigation", () => ({ useParams: () => ({ id: "seed-defindex" }) }));
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({
    isConnected: true,
    isAuthenticated: true,
    address: "G...",
    points: 0,
    user: null,
    connect: jest.fn(),
  }),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: jest.fn(), refetchQueries: jest.fn() }),
}));
jest.mock("@/gen-quest/hooks", () => ({
  useCampaignsControllerFindOne: () => ({
    data: {
      data: {
        id: "seed-defindex",
        title: "Index Builder",
        tasks: [{ id: "t1", title: "Design your index", pointReward: 100, order: 0 }],
        participation: { id: "p1" },
      },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useCampaignsControllerGetNotJoinedCampaigns: () => ({ data: undefined, isLoading: false }),
  useCampaignsControllerJoinCampaign: () => ({ mutate: jest.fn(), isPending: false }),
  useCampaignsControllerClaimCampaign: () => ({ mutate: jest.fn(), isPending: false }),
  useTasksControllerVerifyTask: () => ({ mutate: jest.fn(), isPending: false }),
  useTasksControllerGetStatus: () => ({ data: undefined, refetch: jest.fn() }),
  useTasksControllerGetClaimStatus: () => ({ data: undefined, refetch: jest.fn() }),
  useTasksControllerClaimTask: () => ({ mutate: jest.fn(), isPending: false }),
  useSocialAccountsControllerFindAll: () => ({ data: undefined, refetch: jest.fn() }),
  useSocialAccountsControllerLinkAccount: () => ({ mutate: jest.fn() }),
  useUsersControllerGetMe: () => ({ data: undefined, refetch: jest.fn() }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
}));

describe("CampaignDetail", () => {
  it("renders the campaign title and a quest step", () => {
    render(<CampaignDetail />);
    expect(screen.getByText("Index Builder")).toBeInTheDocument();
    expect(screen.getByText("Design your index")).toBeInTheDocument();
  });
});

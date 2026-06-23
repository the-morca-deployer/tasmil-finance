import { render, screen } from "@testing-library/react";
import Navbar from "../Navbar";

jest.mock("next/navigation", () => ({ usePathname: () => "/quest" }));
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({
    isAuthenticating: false,
    address: "G...",
    displayAddress: "G...EF",
    points: 10,
    user: { username: "dev" },
    connect: jest.fn(),
    disconnect: jest.fn(),
    isAuthenticated: true,
    isConnected: true,
  }),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

const mockMyCampaigns = jest.fn();
jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetCheckInStatus: () => ({ data: undefined }),
  useUsersControllerDailyLogin: () => ({ mutate: jest.fn(), isPending: false }),
  useUsersControllerGetMyCampaigns: () => mockMyCampaigns(),
  usersControllerGetMeQueryKey: () => ["users", "me"],
}));

describe("Quest header sponsor badge", () => {
  it("shows the sponsor name when a joined campaign is sponsored", () => {
    mockMyCampaigns.mockReturnValue({
      data: { data: [{ id: "c1", metadata: { sponsor: "DefIndex" } }] },
    });
    render(<Navbar />);
    expect(screen.getByTestId("quest-sponsor-badge")).toHaveTextContent("DefIndex");
  });

  it("hides the badge when no joined campaign is sponsored", () => {
    mockMyCampaigns.mockReturnValue({ data: { data: [{ id: "c2", metadata: {} }] } });
    render(<Navbar />);
    expect(screen.queryByTestId("quest-sponsor-badge")).not.toBeInTheDocument();
  });
});

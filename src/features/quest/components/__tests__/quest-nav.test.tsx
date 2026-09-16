import { render, screen } from "@testing-library/react";
import Navbar from "../Navbar";

jest.mock("next/navigation", () => ({ usePathname: () => "/quest" }));
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({
    isAuthenticating: false,
    address: null,
    displayAddress: null,
    points: 0,
    user: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    isAuthenticated: false,
    isConnected: false,
  }),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetCheckInStatus: () => ({ data: undefined }),
  useUsersControllerDailyLogin: () => ({ mutate: jest.fn(), isPending: false }),
  useUsersControllerGetMyCampaigns: () => ({ data: undefined }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
  // Navbar also calls useReferralControllerGetMyReferral (added after this mock
  // was written). It reads `const { data: refRaw } = ...`, so undefined is safe.
  useReferralControllerGetMyReferral: () => ({ data: undefined }),
}));

describe("Quest Navbar", () => {
  it("links the nav items to /quest/* routes", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /campaigns/i })).toHaveAttribute(
      "href",
      "/quest/campaigns"
    );
    expect(screen.getByRole("link", { name: /leaderboard/i })).toHaveAttribute(
      "href",
      "/quest/leaderboard"
    );
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
      "href",
      "/quest/profile"
    );
  });
});

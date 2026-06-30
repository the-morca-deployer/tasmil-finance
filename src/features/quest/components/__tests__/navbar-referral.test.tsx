import { render, screen } from "@testing-library/react";
import Navbar from "../Navbar";

// Base wallet-context mock — disconnected by default; overridden per test
const mockUseWallet = jest.fn();
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => mockUseWallet(),
}));

jest.mock("next/navigation", () => ({ usePathname: () => "/quest" }));

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: jest.fn(), refetchQueries: jest.fn() }),
}));

jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetCheckInStatus: () => ({ data: undefined, refetch: jest.fn() }),
  useUsersControllerDailyLogin: () => ({ mutate: jest.fn(), isPending: false }),
  useUsersControllerGetMyCampaigns: () => ({ data: undefined }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
  useReferralControllerGetMyReferral: () => mockUseReferral(),
}));

// Separate mock fn so each test can configure the referral response
const mockUseReferral = jest.fn();

// WalletRankInfo fetches its own data — stub it out
jest.mock("../WalletRankInfo", () => ({ WalletRankInfo: () => null }));

// sonner is not installed in test env
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const connectedWallet = {
  isAuthenticating: false,
  address: "GABCDEF1234567890",
  displayAddress: "GABC…7890",
  points: 100,
  user: { loginStreak: 3, avatarUrl: null, referralCode: null },
  connect: jest.fn(),
  disconnect: jest.fn(),
  isAuthenticated: true,
  isConnected: true,
};

describe("Navbar referral rows", () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue(connectedWallet);
    mockUseReferral.mockReset();
  });

  it("dropdown shows the user's referral code and a referrer name", () => {
    mockUseReferral.mockReturnValue({
      data: {
        data: {
          referralCode: "CODE-B",
          referredBy: { code: "CODE-A", name: "alice", walletAddress: "GREFA1234REFA" },
        },
      },
    });

    render(<Navbar />);

    // The referral code row must be visible (desktop dropdown is CSS-hover; it's in the DOM)
    expect(screen.getByText(/CODE-B/)).toBeInTheDocument();
    // The referrer label should show the name "alice"
    expect(screen.getByText(/alice|CODE-A|GREFA/)).toBeInTheDocument();
  });

  it("dropdown shows a placeholder dash when there is no referrer", () => {
    mockUseReferral.mockReturnValue({
      data: {
        data: {
          referralCode: "CODE-B",
          referredBy: null,
        },
      },
    });

    render(<Navbar />);

    // "Referred by:" label must be present even with no referrer
    expect(screen.getAllByText(/Referred by/i).length).toBeGreaterThan(0);
  });
});

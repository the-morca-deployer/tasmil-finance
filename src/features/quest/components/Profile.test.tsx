import { fireEvent, render, screen } from "@testing-library/react";
import Profile from "./Profile";

jest.mock("@/gen-quest", () => ({
  useUsersControllerGetMe: () => ({
    data: {
      data: { totalPoints: 2550, loginStreak: 3, completedQuests: 7, walletAddress: "G..." },
    },
    isLoading: false,
  }),
  useSocialAccountsControllerFindAll: () => ({ data: { data: [] }, refetch: jest.fn() }),
}));
jest.mock("../store/use-quest-auth", () => ({
  useQuestAuthStore: () => ({ isAuthenticated: true, user: { walletAddress: "G..." } }),
}));
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({ isAuthenticated: true, address: "G...", connect: jest.fn() }),
}));
jest.mock("./social/SocialConnectButtons", () => ({
  SocialConnectSection: () => <div data-testid="social-section" />,
  SocialConnectCard: () => null,
}));

describe("Profile", () => {
  // tierDisplay(2550) -> Gold band [2500, 5000), nextTier Diamond
  it("Overview shows Gold tier and progress toward Diamond", () => {
    render(<Profile />);
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText(/Diamond/)).toBeInTheDocument();
  });
  it("Social tab renders the social connect section", () => {
    render(<Profile />);
    fireEvent.click(screen.getByRole("button", { name: /Social/i }));
    expect(screen.getByTestId("social-section")).toBeInTheDocument();
  });
});

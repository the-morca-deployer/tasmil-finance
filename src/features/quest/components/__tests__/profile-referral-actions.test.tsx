"use client";

/**
 * Task 8 — TDD tests for referral action buttons in Profile.tsx
 *
 * Covers:
 *  1. ReferralsTab "Share Link" calls clipboard with the canonical /r/ URL.
 *  2. ReferralsTab "Copy Code" does NOT call clipboard with the "—" placeholder.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Mock } from "jest-mock";
import Profile from "../Profile";

// ---- next/navigation: force the referrals tab ----
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/profile",
  useSearchParams: () => new URLSearchParams("tab=referrals"),
}));

// ---- wallet context ----
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({
    isAuthenticated: true,
    address: "GDPI...TKEF",
    user: { referralCode: "CODE-A" },
    connect: jest.fn(),
  }),
}));

// ---- quest auth store ----
jest.mock("@/features/quest/store/use-quest-auth", () => ({
  useQuestAuthStore: () => ({
    user: { referralCode: "CODE-A" },
    updateUser: jest.fn(),
  }),
}));

// ---- gen-quest hooks (all hooks used by ReferralsTab + shared) ----
jest.mock("@/gen-quest/hooks", () => ({
  useReferralControllerGetMyReferral: jest.fn(),
  useUsersControllerGetReferrals: jest.fn(),
  useReferralControllerGetTree: jest.fn(),
  // Tier / social hooks (used in other tabs; mocked so imports don't crash)
  useTierRewardsControllerList: jest.fn().mockReturnValue({ data: [] }),
  useTierRewardsControllerClaim: jest.fn().mockReturnValue({ mutate: jest.fn(), isPending: false }),
  useSocialAccountsControllerFindAll: jest
    .fn()
    .mockReturnValue({ data: { data: [] }, refetch: jest.fn() }),
  useSocialAccountsControllerLinkAccount: jest
    .fn()
    .mockReturnValue({ mutate: jest.fn(), isPending: false }),
  useSocialAccountsControllerUnlinkAccount: jest
    .fn()
    .mockReturnValue({ mutate: jest.fn(), isPending: false }),
  useUsersControllerUpdateProfile: jest.fn().mockReturnValue({ mutate: jest.fn(), isPending: false }),
  useUsersControllerGetMyCampaigns: jest.fn().mockReturnValue({ data: { data: [] }, isLoading: false }),
  useUsersControllerGetPointsHistory: jest.fn().mockReturnValue({ data: { data: [] } }),
  // Query key helpers
  referralControllerGetMyReferralQueryKey: jest.fn().mockReturnValue([{ url: "/api/quest/referral/me" }]),
  usersControllerGetMeQueryKey: jest.fn().mockReturnValue([{ url: "/api/quest/users/me" }]),
  tierRewardsControllerListQueryKey: jest.fn().mockReturnValue([{ url: "/api/quest/tier-rewards" }]),
}));

// ---- gen-quest client (used directly in the useMutation mutationFn) ----
jest.mock("@/gen-quest/client/users-controller-set-referral-code", () => ({
  usersControllerSetReferralCode: jest.fn().mockResolvedValue({}),
}));

// ---- @tanstack/react-query: provide a working useMutation stub ----
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: jest.fn().mockReturnValue({
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

// Resolve the mock functions so we can change their return value per-test.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hooks = require("@/gen-quest/hooks");

const mockGetMyReferral = hooks.useReferralControllerGetMyReferral as Mock;
const mockGetReferrals = hooks.useUsersControllerGetReferrals as Mock;
const mockGetTree = hooks.useReferralControllerGetTree as Mock;

describe("Profile referral actions", () => {
  beforeEach(() => {
    // Default: user has a valid referral code
    mockGetMyReferral.mockReturnValue({
      data: { referralCode: "CODE-A", totalEarned: 0, totalInvited: 0, rates: [] },
    });
    mockGetReferrals.mockReturnValue({ data: [] });
    mockGetTree.mockReturnValue({ data: null, isLoading: false });

    // Reset clipboard spy
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn() },
      writable: true,
      configurable: true,
    });
  });

  it("Share Link copies the canonical /r/ url", async () => {
    render(<Profile />);

    // There is one "Share Link" button in ReferralsTab
    const shareBtn = await screen.findByRole("button", { name: /share link/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://tasmil.finance/r/CODE-A"
      );
    });
  });

  it("Copy Code does not copy the placeholder dash when there is no code", async () => {
    // No referral code returned → falls back to "—"
    mockGetMyReferral.mockReturnValue({ data: {} });

    render(<Profile />);

    const copyBtn = await screen.findByRole("button", { name: /copy code/i });
    fireEvent.click(copyBtn);

    // clipboard.writeText must not have been called with "—"
    expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith("—");
  });
});

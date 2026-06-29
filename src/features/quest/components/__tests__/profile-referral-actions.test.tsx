"use client";

/**
 * Task 8 — TDD tests for referral action buttons in Profile.tsx
 *
 * Covers:
 *  1. ReferralsTab "Share Link" calls clipboard with the canonical /r/ URL.
 *  2. ReferralsTab "Copy Code" does NOT touch the clipboard at all when the
 *     code resolves to the "—" placeholder (guard branch exercised).
 *  3. "Set custom code" normalises input to uppercase/charset, calls the
 *     set-referral-code client with the normalised code, and invalidates the
 *     referral query on success.
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

// ---- quest auth store: controllable per-test via __setAuthState ----
jest.mock("@/features/quest/store/use-quest-auth", () => {
  let state: { user: unknown; updateUser: () => void } = {
    user: { referralCode: "CODE-A" },
    updateUser: jest.fn(),
  };
  return {
    useQuestAuthStore: () => state,
    __setAuthState: (s: { user: unknown; updateUser: () => void }) => {
      state = s;
    },
  };
});

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
  useUsersControllerUpdateProfile: jest
    .fn()
    .mockReturnValue({ mutate: jest.fn(), isPending: false }),
  useUsersControllerGetMyCampaigns: jest
    .fn()
    .mockReturnValue({ data: { data: [] }, isLoading: false }),
  useUsersControllerGetPointsHistory: jest.fn().mockReturnValue({ data: { data: [] } }),
  // Query key helpers
  referralControllerGetMyReferralQueryKey: jest
    .fn()
    .mockReturnValue([{ url: "/api/quest/referral/me" }]),
  usersControllerGetMeQueryKey: jest.fn().mockReturnValue([{ url: "/api/quest/users/me" }]),
  tierRewardsControllerListQueryKey: jest
    .fn()
    .mockReturnValue([{ url: "/api/quest/tier-rewards" }]),
}));

// ---- gen-quest client (used directly in the useMutation mutationFn) ----
jest.mock("@/gen-quest/client/users-controller-set-referral-code", () => ({
  usersControllerSetReferralCode: jest.fn().mockResolvedValue({}),
}));

// ---- @tanstack/react-query: functional useMutation + spyable invalidate ----
jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  const invalidateQueries = jest.fn();
  return {
    ...actual,
    __invalidateQueries: invalidateQueries,
    // Run the real mutationFn + onSuccess so normalisation and invalidation are exercised.
    useMutation: jest.fn(
      (opts: {
        mutationFn: (v: unknown) => Promise<unknown>;
        onSuccess?: (r: unknown, v: unknown) => void;
      }) => ({
        mutateAsync: async (vars: unknown) => {
          const res = await opts.mutationFn(vars);
          await opts.onSuccess?.(res, vars);
          return res;
        },
        isPending: false,
      })
    ),
    useQueryClient: () => ({ invalidateQueries }),
  };
});

// Resolve the mock functions so we can change their return value per-test.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hooks = require("@/gen-quest/hooks");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const authStore = require("@/features/quest/store/use-quest-auth");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rq = require("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const setCodeClient = require("@/gen-quest/client/users-controller-set-referral-code");

const mockGetMyReferral = hooks.useReferralControllerGetMyReferral as Mock;
const mockGetReferrals = hooks.useUsersControllerGetReferrals as Mock;
const mockGetTree = hooks.useReferralControllerGetTree as Mock;
const mockSetReferralCode = setCodeClient.usersControllerSetReferralCode as Mock;
const mockInvalidateQueries = rq.__invalidateQueries as Mock;

describe("Profile referral actions", () => {
  beforeEach(() => {
    // Default: user has a valid referral code
    mockGetMyReferral.mockReturnValue({
      data: { referralCode: "CODE-A", totalEarned: 0, totalInvited: 0, rates: [] },
    });
    mockGetReferrals.mockReturnValue({ data: [] });
    mockGetTree.mockReturnValue({ data: null, isLoading: false });
    authStore.__setAuthState({ user: { referralCode: "CODE-A" }, updateUser: jest.fn() });

    // Reset clipboard spy
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn() },
      writable: true,
      configurable: true,
    });
  });

  it("Share Link copies the canonical /r/ url", async () => {
    render(<Profile />);

    const shareBtn = await screen.findByRole("button", { name: /share link/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://tasmil.finance/r/CODE-A");
    });
  });

  it("Copy Code does not touch the clipboard when the code is the placeholder", async () => {
    // No code from the referral query AND no code in the auth store → resolves to "—"
    mockGetMyReferral.mockReturnValue({ data: {} });
    authStore.__setAuthState({ user: { referralCode: undefined }, updateUser: jest.fn() });

    render(<Profile />);

    // Sanity: the placeholder is actually rendered (proves referralCode === "—")
    expect(await screen.findByText("—")).toBeInTheDocument();

    const copyBtn = await screen.findByRole("button", { name: /copy code/i });
    fireEvent.click(copyBtn);

    // Guard must short-circuit BEFORE any clipboard write.
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("Set custom code normalises input and calls the client + invalidates on success", async () => {
    render(<Profile />);

    // Reveal the custom-code input.
    fireEvent.click(screen.getByRole("button", { name: /set custom code/i }));

    const input = (await screen.findByPlaceholderText(/your-code/i)) as HTMLInputElement;

    // Type lowercase + an illegal char; onChange should uppercase and strip charset.
    fireEvent.change(input, { target: { value: "my-code1!" } });
    expect(input.value).toBe("MY-CODE1");

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(mockSetReferralCode).toHaveBeenCalledWith({ data: { code: "MY-CODE1" } });
    });
    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: [{ url: "/api/quest/referral/me" }],
      });
    });
  });
});

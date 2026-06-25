/**
 * Axios-level mock interceptors — intercept requests in-process.
 * No service worker needed.
 *
 * Quest API uses baseURL="/api" → paths like /api/api/campaigns
 * Response interceptor in api-client.ts unwraps { success, data } → data
 */
import { questApiClient } from "@/features/quest/lib/api-client";

import {
  getCampaignsEnvelope,
  getCampaignById,
  getNotJoinedEnvelope,
  MOCK_USER_ME,
  MOCK_CHECK_IN_STATUS,
  MOCK_DAILY_LOGIN_RESULT,
  MOCK_POINTS_HISTORY,
  MOCK_MY_CAMPAIGNS_PENDING,
  MOCK_MY_CAMPAIGNS_CLAIMABLE,
  MOCK_MY_CAMPAIGNS_CLAIMED,
  MOCK_LEADERBOARD,
  MOCK_STREAK_LEADERBOARD,
  MOCK_CURRENT_SEASON,
  MOCK_MY_SEASON_RESULT,
  MOCK_REFERRAL,
  MOCK_REFERRALS_LIST,
  MOCK_SOCIAL_ACCOUNTS,
  MUTATION_SUCCESS,
  buildTaskStatus,
  buildTaskClaimStatus,
} from "./data/quest";

const QB = "/api/api"; // quest base path

// Returns an Axios adapter that resolves immediately with the given data
function respond(config: { url?: string; params?: Record<string, unknown> }, data: unknown) {
  return Promise.resolve({
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
    request: {},
  });
}

export function applyMockAdapter() {
  // ── Quest API interceptor ──
  questApiClient.interceptors.request.use((config) => {
    const { url } = config;

    // Helper to replace the adapter
    const mock = (data: unknown) => {
      // eslint-disable-next-line no-param-reassign
      (config as unknown as Record<string, unknown>).adapter = () => respond(config, data);
      return config;
    };

    // ── Campaigns ──
    if (url === `${QB}/campaigns`) {
      const p = config.params || {};
      if (p.active === "true") return mock(getCampaignsEnvelope(() => true));
      if (p.isFeatured === "true") return mock(getCampaignsEnvelope((c) => !!c.isFeatured));
      return mock(getCampaignsEnvelope(() => true));
    }
    if (url === `${QB}/campaigns/not-joined`) return mock(getNotJoinedEnvelope());

    const campDetail = url?.match(/^\/api\/api\/campaigns\/([^/]+)$/);
    if (campDetail) {
      const r = getCampaignById(campDetail[1]!);
      return mock("status" in r ? null : r);
    }

    if (url?.match(/^\/api\/api\/campaigns\/[^/]+\/join$/)) return mock(MUTATION_SUCCESS);
    if (url?.match(/^\/api\/api\/campaigns\/[^/]+\/claim$/)) return mock({ success: true, data: { claimed: true, points: 150 } });

    // ── Tasks ──
    const taskStatus = url?.match(/^\/api\/api\/tasks\/([^/]+)\/status$/);
    if (taskStatus) return mock(buildTaskStatus(taskStatus[1]!));

    const taskClaimStatus = url?.match(/^\/api\/api\/tasks\/([^/]+)\/claim-status$/);
    if (taskClaimStatus) return mock(buildTaskClaimStatus(taskClaimStatus[1]!));

    if (url?.match(/^\/api\/api\/tasks\/[^/]+\/verify$/)) return mock({ success: true, data: { success: true, message: "Verified!" } });
    if (url?.match(/^\/api\/api\/tasks\/[^/]+\/claim$/)) return mock({ success: true, data: { claimed: true, points: 25 } });
    if (url?.match(/^\/api\/api\/tasks\/[^/]+\/record-visit$/)) return mock(MUTATION_SUCCESS);

    // ── Users ──
    if (url === `${QB}/users/me`) return mock(MOCK_USER_ME);
    if (url === `${QB}/users/me/social-accounts`) return mock(MOCK_SOCIAL_ACCOUNTS);
    if (url === `${QB}/users/referrals`) return mock(MOCK_REFERRALS_LIST);
    if (url === `${QB}/users/check-in-status`) return mock(MOCK_CHECK_IN_STATUS);
    if (url?.match(/^\/api\/api\/users\/[^/]+\/points-history$/)) return mock(MOCK_POINTS_HISTORY);
    if (url?.match(/^\/api\/api\/users\/[^/]+\/profile$/)) return mock(MUTATION_SUCCESS);

    if (url === `${QB}/users/my-campaigns`) {
      const s = config.params?.status;
      if (s === "claimable") return mock(MOCK_MY_CAMPAIGNS_CLAIMABLE);
      if (s === "claimed") return mock(MOCK_MY_CAMPAIGNS_CLAIMED);
      return mock(MOCK_MY_CAMPAIGNS_PENDING);
    }

    // ── Leaderboard ──
    if (url === `${QB}/analytics/global-leaderboard`) return mock(MOCK_LEADERBOARD);
    if (url === `${QB}/analytics/streak-leaderboard`) return mock(MOCK_STREAK_LEADERBOARD);

    // ── Seasons ──
    if (url === `${QB}/seasons/current`) return mock(MOCK_CURRENT_SEASON);
    if (url === `${QB}/seasons/me`) return mock(MOCK_MY_SEASON_RESULT);

    // ── Referrals ──
    if (url === `${QB}/referral/my-referral`) return mock(MOCK_REFERRAL);
    if (url === `${QB}/referral/leaderboard`) return mock(MOCK_LEADERBOARD);

    // ── Social Accounts ──
    if (url?.match(/^\/api\/api\/social-accounts$/)) return mock(MUTATION_SUCCESS);
    if (url?.match(/^\/api\/api\/social-accounts\/unlink$/)) return mock(MUTATION_SUCCESS);

    // ── Auth ──
    if (url === `${QB}/auth/wallet-nonce`) return mock({ nonce: "mock-nonce" });
    if (url?.match(/^\/api\/api\/auth\/(wallet-login|username-login)$/)) {
      return mock({ success: true, data: { accessToken: "mock-jwt", refreshToken: "mock-refresh", user: MOCK_USER_ME.data } });
    }
    if (url?.match(/^\/api\/api\/auth\/refresh$/)) return mock({ success: true, data: { accessToken: "mock-jwt", refreshToken: "mock-refresh" } });
    if (url?.match(/^\/api\/api\/auth\/logout$/)) return mock(MUTATION_SUCCESS);

    // ── Daily login ──
    if (url === `${QB}/users/daily-login`) return mock(MOCK_DAILY_LOGIN_RESULT);

    // ── Notifications ──
    if (url?.match(/^\/api\/api\/notifications$/)) return mock({ data: [] });

    return config; // pass through unmatched URLs
  });

  console.warn("[mock] Axios interceptor installed — quest API mocked");
}

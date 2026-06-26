/**
 * Axios-level mock interceptors — intercept requests in-process.
 * No service worker needed.
 *
 * gen-quest client URLs use /api/quest/... and /api/auth/...
 * Axios interceptor sees config.url BEFORE baseURL is prepended, so we
 * match against the raw path set in the generated client files.
 * Response interceptor in api-client.ts unwraps { success, data } → data.
 *
 * All gen-quest hooks should be called with `$` or `withAuth` so they use
 * questApiClient (which this interceptor is installed on).
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
  MOCK_REFERRAL_TREE,
  MOCK_REFERRALS_LIST,
  MOCK_SOCIAL_ACCOUNTS,
  MUTATION_SUCCESS,
  buildTaskStatus,
  buildTaskClaimStatus,
} from "./data/quest";

// gen-quest client files emit URLs like /api/quest/campaigns (QB)
// and /api/auth/verify (AB). config.url in the interceptor is the raw path.
const QB = "/api/quest";
const AB = "/api/auth";

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
      if ((p as Record<string, unknown>).active === "true") return mock(getCampaignsEnvelope(() => true));
      if ((p as Record<string, unknown>).isFeatured === "true") return mock(getCampaignsEnvelope((c) => !!c.isFeatured));
      return mock(getCampaignsEnvelope(() => true));
    }
    if (url === `${QB}/campaigns/not-joined`) return mock(getNotJoinedEnvelope());

    const campDetail = url?.match(/^\/api\/quest\/campaigns\/([^/]+)$/);
    if (campDetail) {
      const r = getCampaignById(campDetail[1]!);
      return mock("status" in r ? null : r);
    }

    if (url?.match(/^\/api\/quest\/campaigns\/[^/]+\/join$/)) return mock(MUTATION_SUCCESS);
    if (url?.match(/^\/api\/quest\/campaigns\/[^/]+\/claim$/))
      return mock({ success: true, data: { claimed: true, points: 150 } });

    // ── Tasks ──
    const taskStatus = url?.match(/^\/api\/quest\/tasks\/([^/]+)\/status$/);
    if (taskStatus) return mock(buildTaskStatus(taskStatus[1]!));

    const taskClaimStatus = url?.match(/^\/api\/quest\/tasks\/([^/]+)\/claim-status$/);
    if (taskClaimStatus) return mock(buildTaskClaimStatus(taskClaimStatus[1]!));

    if (url?.match(/^\/api\/quest\/tasks\/[^/]+\/verify$/))
      return mock({ success: true, data: { success: true, message: "Verified!" } });
    if (url?.match(/^\/api\/quest\/tasks\/[^/]+\/claim$/))
      return mock({ success: true, data: { claimed: true, points: 25 } });
    if (url?.match(/^\/api\/quest\/tasks\/[^/]+\/visit$/)) return mock(MUTATION_SUCCESS);
    if (url?.match(/^\/api\/quest\/tasks\/[^/]+\/submit-proof$/)) return mock(MUTATION_SUCCESS);
    if (url === `${QB}/tasks/complete-by-action`) return mock(MUTATION_SUCCESS);

    // ── Users ──
    if (url === `${QB}/users/me` && config.method !== "patch") return mock(MOCK_USER_ME);
    if (url === `${QB}/users/me` && config.method === "patch") return mock(MUTATION_SUCCESS);

    // GET /api/quest/users/me/campaign  (My Quests tab)
    if (url === `${QB}/users/me/campaign`) {
      const s = (config.params as Record<string, unknown>)?.status;
      if (s === "claimable") return mock(MOCK_MY_CAMPAIGNS_CLAIMABLE);
      if (s === "claimed") return mock(MOCK_MY_CAMPAIGNS_CLAIMED);
      return mock(MOCK_MY_CAMPAIGNS_PENDING);
    }

    if (url === `${QB}/users/me/referrals`) return mock(MOCK_REFERRALS_LIST);
    if (url === `${QB}/users/me/check-in-status`) return mock(MOCK_CHECK_IN_STATUS);
    if (url === `${QB}/users/me/daily-login`) return mock(MOCK_DAILY_LOGIN_RESULT);
    if (url?.match(/^\/api\/quest\/users\/[^/]+\/points-history$/)) return mock(MOCK_POINTS_HISTORY);

    // ── Social Accounts ──
    if (url === `${QB}/social-accounts` && config.method !== "delete") return mock(MOCK_SOCIAL_ACCOUNTS);
    if (url?.match(/^\/api\/quest\/social-accounts\/[^/]+\/link$/)) return mock(MUTATION_SUCCESS);
    if (url?.match(/^\/api\/quest\/social-accounts\/[^/]+$/) && config.method === "delete")
      return mock(MUTATION_SUCCESS);

    // ── Leaderboard ──
    if (url === `${QB}/leaderboard/global`) return mock(MOCK_LEADERBOARD);
    if (url === `${QB}/leaderboard/streak`) return mock(MOCK_STREAK_LEADERBOARD);

    // ── Seasons ──
    if (url === `${QB}/seasons/current`) return mock(MOCK_CURRENT_SEASON);
    if (url === `${QB}/seasons/me`) return mock(MOCK_MY_SEASON_RESULT);
    if (url === `${QB}/seasons/me/reveal-ack`) return mock(MUTATION_SUCCESS);
    if (url === `${QB}/seasons/current/leaderboard`) return mock(MOCK_LEADERBOARD);

    // ── Referrals ──
    if (url === `${QB}/referral/me`) return mock(MOCK_REFERRAL);
    if (url === `${QB}/referral/leaderboard`) return mock(MOCK_LEADERBOARD);
    if (url === `${QB}/referral/tree`) return mock(MOCK_REFERRAL_TREE);

    // ── Auth ──
    if (url === `${AB}/challenge`) return mock({ nonce: "mock-nonce" });
    if (url === `${AB}/verify`) {
      return mock({
        success: true,
        data: { accessToken: "mock-jwt", refreshToken: "mock-refresh", user: MOCK_USER_ME.data },
      });
    }
    if (url === `${AB}/login`) {
      return mock({
        success: true,
        data: { accessToken: "mock-jwt", refreshToken: "mock-refresh", user: MOCK_USER_ME.data },
      });
    }
    if (url === `${AB}/refresh`)
      return mock({ success: true, data: { accessToken: "mock-jwt-refreshed", refreshToken: "mock-refresh" } });
    if (url === `${AB}/logout`) return mock(MUTATION_SUCCESS);

    // ── Notifications ──
    if (url === `${QB}/notifications`)
      return mock({ success: true, data: { items: [], meta: { total: 0, page: 1, limit: 20 } } });

    return config; // pass through unmatched URLs
  });

  console.warn("[mock] Axios interceptor installed — quest API mocked (paths: /api/quest/...)");
}

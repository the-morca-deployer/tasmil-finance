/**
 * Quest API mock interceptor — loaded only when NEXT_PUBLIC_MOCK_API=true.
 * Installed directly by api-client.ts at module creation time.
 */
import type { AxiosInstance } from "axios";
import {
  buildTaskClaimStatus,
  buildTaskStatus,
  getCampaignById,
  getCampaignsEnvelope,
  getNotJoinedEnvelope,
  MOCK_CHECK_IN_STATUS,
  MOCK_CURRENT_SEASON,
  MOCK_DAILY_LOGIN_RESULT,
  MOCK_LEADERBOARD,
  MOCK_MY_CAMPAIGNS_CLAIMABLE,
  MOCK_MY_CAMPAIGNS_CLAIMED,
  MOCK_MY_CAMPAIGNS_PENDING,
  MOCK_MY_SEASON_RESULT,
  MOCK_POINTS_HISTORY,
  MOCK_REFERRAL,
  MOCK_REFERRALS_LIST,
  MOCK_SOCIAL_ACCOUNTS,
  MOCK_STREAK_LEADERBOARD,
  MOCK_USER_ME,
  MUTATION_SUCCESS,
} from "@/mocks/data/quest";

const QB = "/api/api";

function respond(config: Record<string, unknown>, data: unknown) {
  return Promise.resolve({
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
    request: {},
  });
}

export function installQuestMocks(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    const url = config.url;

    const mock = (data: unknown) => {
      (config as unknown as Record<string, unknown>).adapter = () =>
        respond(config as unknown as Record<string, unknown>, data);
      return config;
    };

    // Campaigns
    if (url === `${QB}/campaigns`) {
      const p = (config.params || {}) as Record<string, string>;
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
    if (url?.match(/^\/api\/api\/campaigns\/[^/]+\/claim$/)) {
      return mock({ success: true, data: { claimed: true, points: 150 } });
    }

    // Tasks
    const taskStatus = url?.match(/^\/api\/api\/tasks\/([^/]+)\/status$/);
    if (taskStatus) return mock(buildTaskStatus(taskStatus[1]!));
    const taskClaim = url?.match(/^\/api\/api\/tasks\/([^/]+)\/claim-status$/);
    if (taskClaim) return mock(buildTaskClaimStatus(taskClaim[1]!));
    if (url?.match(/^\/api\/api\/tasks\/[^/]+\/verify$/)) {
      return mock({ success: true, data: { success: true, message: "Verified!" } });
    }
    if (url?.match(/^\/api\/api\/tasks\/[^/]+\/claim$/)) {
      return mock({ success: true, data: { claimed: true, points: 25 } });
    }
    if (url?.match(/^\/api\/api\/tasks\/[^/]+\/record-visit$/)) return mock(MUTATION_SUCCESS);

    // Users
    if (url === `${QB}/users/me`) return mock(MOCK_USER_ME);
    if (url === `${QB}/users/me/social-accounts`) return mock(MOCK_SOCIAL_ACCOUNTS);
    if (url === `${QB}/users/referrals`) return mock(MOCK_REFERRALS_LIST);
    if (url === `${QB}/users/check-in-status`) return mock(MOCK_CHECK_IN_STATUS);
    if (url?.match(/^\/api\/api\/users\/[^/]+\/points-history$/)) return mock(MOCK_POINTS_HISTORY);
    if (url?.match(/^\/api\/api\/users\/[^/]+\/profile$/)) return mock(MUTATION_SUCCESS);
    if (url === `${QB}/users/my-campaigns`) {
      const s = (config.params as Record<string, string>)?.status;
      if (s === "claimable") return mock(MOCK_MY_CAMPAIGNS_CLAIMABLE);
      if (s === "claimed") return mock(MOCK_MY_CAMPAIGNS_CLAIMED);
      return mock(MOCK_MY_CAMPAIGNS_PENDING);
    }
    if (url === `${QB}/users/daily-login`) return mock(MOCK_DAILY_LOGIN_RESULT);

    // Leaderboard
    if (url === `${QB}/analytics/global-leaderboard`) return mock(MOCK_LEADERBOARD);
    if (url === `${QB}/analytics/streak-leaderboard`) return mock(MOCK_STREAK_LEADERBOARD);

    // Seasons
    if (url === `${QB}/seasons/current`) return mock(MOCK_CURRENT_SEASON);
    if (url === `${QB}/seasons/me`) return mock(MOCK_MY_SEASON_RESULT);

    // Referrals
    if (url === `${QB}/referral/my-referral`) return mock(MOCK_REFERRAL);
    if (url === `${QB}/referral/leaderboard`) return mock(MOCK_LEADERBOARD);

    // Social
    if (url?.match(/^\/api\/api\/social-accounts$/)) return mock(MUTATION_SUCCESS);
    if (url?.match(/^\/api\/api\/social-accounts\/unlink$/)) return mock(MUTATION_SUCCESS);

    // Auth
    if (url === `${QB}/auth/wallet-nonce`) return mock({ nonce: "mock-nonce" });
    if (url?.match(/^\/api\/api\/auth\/(wallet-login|username-login)$/)) {
      return mock({
        success: true,
        data: { accessToken: "mock-jwt", refreshToken: "mock-refresh", user: MOCK_USER_ME.data },
      });
    }
    if (url?.match(/^\/api\/api\/auth\/refresh$/)) {
      return mock({
        success: true,
        data: { accessToken: "mock-jwt", refreshToken: "mock-refresh" },
      });
    }
    if (url?.match(/^\/api\/api\/auth\/logout$/)) return mock(MUTATION_SUCCESS);

    // Notifications
    if (url?.match(/^\/api\/api\/notifications$/)) return mock({ data: [] });

    return config;
  });

  console.warn("[mock] Quest API interceptor installed");
}

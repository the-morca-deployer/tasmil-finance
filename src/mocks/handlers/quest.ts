/**
 * MSW handlers for the Quest API.
 * Quest API uses same-origin requests via baseURL: "/api" → paths are /api/api/...
 * Response interceptor unwraps { success, data } envelopes automatically.
 */
import { delay, HttpResponse, http } from "msw";
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
} from "../data/quest";

const D = 150;

// Quest API paths go through baseURL="/api", so the actual path is /api/api/...
// The interceptor unwraps { success, data } → data, so we return the envelope form.

export const questHandlers = [
  // -- Campaigns --
  http.get("/api/api/campaigns", async ({ request }) => {
    await delay(D);
    const url = new URL(request.url, "http://localhost");
    const active = url.searchParams.get("active");
    const isFeatured = url.searchParams.get("isFeatured");

    if (active === "true")
      return HttpResponse.json(
        getCampaignsEnvelope((c) => !!(c.startAt && new Date(c.endAt || "") > new Date()))
      );
    if (active === "false")
      return HttpResponse.json(
        getCampaignsEnvelope((c) => !!(c.endAt && new Date(c.endAt) < new Date()))
      );
    if (isFeatured === "true")
      return HttpResponse.json(getCampaignsEnvelope((c) => !!c.isFeatured));
    return HttpResponse.json(getCampaignsEnvelope(() => true));
  }),

  http.get("/api/api/campaigns/not-joined", async () => {
    await delay(D);
    return HttpResponse.json(getNotJoinedEnvelope());
  }),

  http.get("/api/api/campaigns/:id", async ({ params }) => {
    await delay(D);
    const result = getCampaignById(params.id as string);
    if ("status" in result) return new HttpResponse(null, { status: result.status });
    return HttpResponse.json(result);
  }),

  http.post("/api/api/campaigns/:id/join", async () => {
    await delay(300);
    return HttpResponse.json(MUTATION_SUCCESS);
  }),

  http.post("/api/api/campaigns/:id/claim", async () => {
    await delay(400);
    return HttpResponse.json({ success: true, data: { claimed: true, points: 150 } });
  }),

  // -- Tasks --
  http.get("/api/api/tasks/:taskId/status", async ({ params }) => {
    await delay(D);
    return HttpResponse.json(buildTaskStatus(params.taskId as string));
  }),

  http.get("/api/api/tasks/:taskId/claim-status", async ({ params }) => {
    await delay(D);
    return HttpResponse.json(buildTaskClaimStatus(params.taskId as string));
  }),

  http.post("/api/api/tasks/:taskId/verify", async () => {
    await delay(600);
    return HttpResponse.json({ success: true, data: { success: true, message: "Task verified!" } });
  }),

  http.post("/api/api/tasks/:taskId/claim", async () => {
    await delay(400);
    return HttpResponse.json({ success: true, data: { claimed: true, points: 25 } });
  }),

  http.post("/api/api/tasks/:taskId/record-visit", async () => {
    await delay(200);
    return HttpResponse.json(MUTATION_SUCCESS);
  }),

  // -- Users --
  http.get("/api/api/users/me", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_USER_ME);
  }),

  http.put("/api/api/users/profile", async () => {
    await delay(300);
    return HttpResponse.json(MUTATION_SUCCESS);
  }),

  http.get("/api/api/users/referrals", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_REFERRALS_LIST);
  }),

  http.get("/api/api/users/my-campaigns", async ({ request }) => {
    await delay(D);
    const url = new URL(request.url, "http://localhost");
    const status = url.searchParams.get("status");
    if (status === "pending") return HttpResponse.json(MOCK_MY_CAMPAIGNS_PENDING);
    if (status === "claimable") return HttpResponse.json(MOCK_MY_CAMPAIGNS_CLAIMABLE);
    if (status === "claimed") return HttpResponse.json(MOCK_MY_CAMPAIGNS_CLAIMED);
    return HttpResponse.json(MOCK_MY_CAMPAIGNS_PENDING);
  }),

  http.get("/api/api/users/:id/points-history", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_POINTS_HISTORY);
  }),

  http.get("/api/api/users/check-in-status", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_CHECK_IN_STATUS);
  }),

  http.post("/api/api/users/daily-login", async () => {
    await delay(300);
    return HttpResponse.json(MOCK_DAILY_LOGIN_RESULT);
  }),

  // -- Analytics / Leaderboard --
  http.get("/api/api/analytics/global-leaderboard", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_LEADERBOARD);
  }),

  http.get("/api/api/analytics/streak-leaderboard", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_STREAK_LEADERBOARD);
  }),

  // -- Seasons --
  http.get("/api/api/seasons/current", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_CURRENT_SEASON);
  }),

  http.get("/api/api/seasons/me", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_MY_SEASON_RESULT);
  }),

  http.post("/api/api/seasons/reveal-ack", async () => {
    await delay(300);
    return HttpResponse.json(MUTATION_SUCCESS);
  }),

  // -- Referral --
  http.get("/api/api/referral/my-referral", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_REFERRAL);
  }),

  http.get("/api/api/referral/leaderboard", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_LEADERBOARD);
  }),

  // -- Social Accounts --
  http.get("/api/api/users/me/social-accounts", async () => {
    await delay(D);
    return HttpResponse.json(MOCK_SOCIAL_ACCOUNTS);
  }),

  http.post("/api/api/social-accounts", async () => {
    await delay(400);
    return HttpResponse.json(MUTATION_SUCCESS);
  }),

  http.post("/api/api/social-accounts/unlink", async () => {
    await delay(300);
    return HttpResponse.json(MUTATION_SUCCESS);
  }),

  // -- Auth --
  http.get("/api/api/auth/wallet-nonce", async () => {
    await delay(200);
    return HttpResponse.json({ nonce: "mock-nonce-abc123" });
  }),

  http.post("/api/api/auth/wallet-login", async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: "mock-quest-jwt",
        refreshToken: "mock-quest-refresh",
        user: MOCK_USER_ME.data,
      },
    });
  }),

  http.post("/api/api/auth/refresh", async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { accessToken: "mock-quest-jwt-refreshed", refreshToken: "mock-quest-refresh" },
    });
  }),

  http.post("/api/api/auth/logout", async () => {
    await delay(200);
    return HttpResponse.json(MUTATION_SUCCESS);
  }),

  http.post("/api/api/auth/username-login", async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: "mock-quest-jwt",
        refreshToken: "mock-quest-refresh",
        user: MOCK_USER_ME.data,
      },
    });
  }),

  // -- Notifications --
  http.get("/api/api/notifications", async () => {
    await delay(D);
    return HttpResponse.json({ data: [] });
  }),
];

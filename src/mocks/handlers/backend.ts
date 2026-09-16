/**
 * MSW handlers for the NestJS backend API (port 6756).
 * These paths are same-origin (Next.js proxies them).
 */
import { delay, HttpResponse, http } from "msw";
import { MOCK_ACTIVITY, MOCK_POSITION, MOCK_PRESETS, MOCK_REBALANCE_STATUS } from "../data/account";
import {
  MOCK_AQUARIUS_POSITIONS,
  MOCK_BLEND_POSITIONS,
  MOCK_POOLS,
  MOCK_PORTFOLIO_HISTORY,
  MOCK_SNAPSHOT_RESPONSE,
} from "../data/pools";

const SIMULATED_DELAY = 300; // ms - feels responsive but still shows loading states

export const backendHandlers = [
  // ------- Account -------

  http.get("/api/account/position/:publicKey", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json(MOCK_POSITION);
  }),

  http.get("/api/account/activity/:publicKey", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json(MOCK_ACTIVITY);
  }),

  http.get("/api/account/presets", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json(MOCK_PRESETS);
  }),

  // ------- Account Mutations -------

  http.post("/api/account/deploy", async () => {
    await delay(800);
    return HttpResponse.json({
      success: true,
      data: { vaultAddress: "GCKZLW2GFO4WMXFF3OICHXELSB75HOZS2YT5PKHLBWRZ2EQMH5FNNHTB" },
    });
  }),

  http.post("/api/account/fund", async () => {
    await delay(500);
    return HttpResponse.json({ success: true, data: { txHash: "3a7b9c...f1e2" } });
  }),

  http.post("/api/account/setup", async () => {
    await delay(800);
    return HttpResponse.json({ success: true, data: { ok: true } });
  }),

  http.post("/api/account/resume/:publicKey", async () => {
    await delay(400);
    return HttpResponse.json({ success: true, data: { status: "active" } });
  }),

  http.post("/api/account/submit", async () => {
    await delay(600);
    return HttpResponse.json({ success: true, data: { txHash: "9f2a1b...c8d4" } });
  }),

  http.post("/api/account/withdraw", async () => {
    await delay(800);
    return HttpResponse.json({ success: true, data: { txHash: "8c3d5a...e7b9" } });
  }),

  http.post("/api/account/revoke", async () => {
    await delay(500);
    return HttpResponse.json({ success: true, data: { ok: true } });
  }),

  http.post("/api/account/reactivate", async () => {
    await delay(500);
    return HttpResponse.json({ success: true, data: { status: "active" } });
  }),

  http.put("/api/account/preset/:publicKey", async () => {
    await delay(400);
    return HttpResponse.json({ success: true, data: { preset: "BALANCED" } });
  }),

  // ------- Pools -------

  http.get("/api/pools", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json(MOCK_POOLS);
  }),

  // ------- Rebalance -------

  http.get("/api/rebalance/status", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json(MOCK_REBALANCE_STATUS);
  }),

  http.post("/api/rebalance/resume", async () => {
    await delay(300);
    return HttpResponse.json({ success: true, data: { running: true } });
  }),

  // ------- Portfolio -------

  http.get("/api/portfolio/history/:address", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json(MOCK_PORTFOLIO_HISTORY);
  }),

  http.post("/api/portfolio/snapshot", async () => {
    await delay(200);
    return HttpResponse.json(MOCK_SNAPSHOT_RESPONSE);
  }),

  // ------- DeFi Positions -------

  http.get("/api/positions/blend", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json(MOCK_BLEND_POSITIONS);
  }),

  http.get("/api/positions/aquarius", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json(MOCK_AQUARIUS_POSITIONS);
  }),

  // ------- User -------

  http.get("/api/user", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json({
      success: true,
      data: { accountId: "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R" },
    });
  }),

  // ------- Topup -------

  http.get("/api/topup/packages", async () => {
    await delay(SIMULATED_DELAY);
    return HttpResponse.json({
      success: true,
      data: [
        { id: "pkg-1", amount: 100, price: 10, name: "Starter Pack" },
        { id: "pkg-2", amount: 500, price: 45, name: "Pro Pack" },
        { id: "pkg-3", amount: 2000, price: 160, name: "Whale Pack" },
      ],
    });
  }),

  // ------- Health -------

  http.get("/api/health", async () => {
    await delay(100);
    return HttpResponse.json({ status: "ok" });
  }),

  // ------- Auth (wallet challenge) -------

  http.get("/api/auth/challenge", async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { challenge: "sign-this-mock-challenge-string" },
    });
  }),
];

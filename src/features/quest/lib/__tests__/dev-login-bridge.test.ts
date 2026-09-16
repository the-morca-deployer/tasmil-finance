import { useQuestAuthStore } from "../../store/use-quest-auth";
import { ensureQuestDevSession } from "../dev-login-bridge";

describe("ensureQuestDevSession", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    useQuestAuthStore.getState().logout();
    delete process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;
    delete process.env.NEXT_PUBLIC_QUEST_API_URL;
  });

  // The body below is the real wire format. ensureQuestDevSession uses bare
  // fetch (not the quest axios client), so nothing strips the backend's
  // TransformInterceptor envelope: POST /api/auth/wallet/test-login returns
  // `{ success: true, data: { accessToken, tokenType, expiresIn, role, user } }`.
  // See backend/src/modules/auth/auth.controller.ts#testLogin +
  // common/interceptors/transform.interceptor.ts.
  it("sets the quest auth store from dev-login when bypass is on", async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "true";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          accessToken: "quest-jwt",
          tokenType: "Bearer",
          expiresIn: "24h",
          role: "user",
          user: {
            id: "u1",
            publicKey: "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      }),
    }) as unknown as typeof fetch;

    await ensureQuestDevSession();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/wallet/test-login"),
      expect.objectContaining({ method: "POST" })
    );
    expect(useQuestAuthStore.getState().user?.id).toBe("u1");
    expect(useQuestAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("does nothing when bypass is off", async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "false";
    global.fetch = jest.fn() as unknown as typeof fetch;
    await ensureQuestDevSession();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

import { ensureQuestDevSession } from "../dev-login-bridge";
import { useQuestAuthStore } from "../../store/use-quest-auth";

describe("ensureQuestDevSession", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    useQuestAuthStore.getState().logout();
    delete process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;
    delete process.env.NEXT_PUBLIC_QUEST_API_URL;
  });

  it("sets the quest auth store from dev-login when bypass is on", async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "true";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: "quest-jwt", user: { id: "u1", username: "dev", walletAddress: "G...", tier: "COHORT_4", totalPoints: 10, loginStreak: 1, role: "user" } } }),
    }) as unknown as typeof fetch;

    await ensureQuestDevSession();

    expect(useQuestAuthStore.getState().accessToken).toBe("quest-jwt");
    expect(useQuestAuthStore.getState().isAuthenticated).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/dev-login"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does nothing when bypass is off", async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "false";
    global.fetch = jest.fn() as unknown as typeof fetch;
    await ensureQuestDevSession();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

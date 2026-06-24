import { type AuthUser, useQuestAuthStore } from "../store/use-quest-auth";

const DEV_WALLET = "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R";

interface DevLoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function ensureQuestDevSession(): Promise<void> {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== "true") return;
  if (useQuestAuthStore.getState().isAuthenticated) return;

  try {
    const res = await fetch("/api/auth/wallet/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: DEV_WALLET }),
    });
    if (!res.ok) return;
    const body = (await res.json()) as DevLoginResponse;
    useQuestAuthStore.getState().setUser(body.user);
  } catch (err) {
    console.warn("quest dev-login bridge failed", err);
  }
}

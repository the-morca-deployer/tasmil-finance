import { DEV_WALLET } from "@/lib/dev-bypass";
import { useAuthStore } from "@/store/use-auth";
import { type AuthUser, useQuestAuthStore } from "../store/use-quest-auth";

/**
 * What POST /api/auth/wallet/test-login actually returns.
 *
 * Two things this file used to get wrong. Every backend response is wrapped by
 * TransformInterceptor as `{success, data}`, and the Next rewrite for
 * /api/auth/* is a pure proxy, so nothing unwraps it on the way here -- reading
 * `body.user` yielded undefined, and setUser(undefined) left isAuthenticated
 * false, so the dev bypass silently did nothing at all. And `user` carries the
 * account row, not a quest profile: no username, tier, points or streak, and
 * `role` sits beside it rather than on it.
 */
interface TestLoginEnvelope {
  success?: boolean;
  data?: {
    accessToken?: string;
    role?: string;
    user?: {
      id?: string;
      publicKey?: string;
    };
  };
}

export async function ensureQuestDevSession(): Promise<void> {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== "true") return;
  if (
    useQuestAuthStore.getState().isAuthenticated &&
    useAuthStore.getState().accessToken !== null
  ) {
    return;
  }

  try {
    const res = await fetch("/api/auth/wallet/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: DEV_WALLET }),
    });
    if (!res.ok) return;

    const body = (await res.json()) as TestLoginEnvelope;
    const account = body.data?.user;
    const accessToken = body.data?.accessToken;
    // No account means no session. Setting a half-built user would report
    // authenticated to the rest of the app while holding nothing usable.
    if (!account?.id || !account.publicKey || !accessToken) return;

    useAuthStore.getState().setAuthState({
      accessToken,
      user: {
        id: account.id,
        walletAddress: account.publicKey,
        type: "regular",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    // The quest fields have no source in this response. They are placeholders
    // for a local bypass, deliberately zeroed rather than invented, so nothing
    // downstream mistakes them for real standings.
    const user: AuthUser = {
      id: account.id,
      username: `dev-${account.publicKey.slice(0, 4)}`,
      walletAddress: account.publicKey,
      tier: "unranked",
      totalPoints: 0,
      loginStreak: 0,
      role: body.data?.role ?? "user",
    };
    useQuestAuthStore.getState().setUser(user);
  } catch (err) {
    console.warn("quest dev-login bridge failed", err);
  }
}

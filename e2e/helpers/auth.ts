import { expect, type Page } from "@playwright/test";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";

export interface AuthedSession {
  walletAddress: string;
  jwt: string;
  userId: string;
}

/**
 * Generate a unique Stellar-format public key (G...56 chars).
 * test-login only checks length >= 4, so any prefix-padded string works.
 */
export function freshWallet(): string {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
  return `GE2ECREDITFLOW${stamp}`.padEnd(56, "0").slice(0, 56);
}

/**
 * Authenticate a wallet via the backend test-login endpoint and
 * inject auth + wallet state into localStorage so the frontend
 * believes the user is connected without a real Stellar wallet.
 *
 * Must be called BEFORE page.goto() because addInitScript runs
 * on the next navigation.
 */
export async function loginAsWallet(page: Page, walletAddress: string): Promise<AuthedSession> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  if (!response.ok()) {
    throw new Error(`test-login failed ${response.status()}: ${await response.text()}`);
  }
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  const userId: string = body?.data?.user?.id ?? body?.user?.id;
  expect(jwt).toBeTruthy();
  expect(userId).toBeTruthy();

  await page.addInitScript(
    ({ walletAddress, jwt }) => {
      // Zustand persist store for useAuthStore (key: "auth-storage")
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: jwt,
            user: {
              id: walletAddress,
              walletAddress,
              type: "regular",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isLoading: false,
            expiresAt: Date.now() + 60 * 60 * 1000,
          },
          version: 0,
        })
      );
      // Zustand persist store for useWalletStore (key: "wallet-storage")
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({ state: { account: walletAddress }, version: 0 })
      );
    },
    { walletAddress, jwt }
  );

  return { walletAddress, jwt, userId };
}

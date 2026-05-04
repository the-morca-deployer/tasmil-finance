import type { Page } from "@playwright/test";
import type { WalletConfig } from "./test-wallet";
import { deriveSecretKey, resolvePublicKey } from "./test-wallet";

const NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015";

/**
 * Programmatic wallet authentication — no Freighter extension needed.
 *
 * Uses the Playwright page context (which has dev tunnel auth cookies from storageState)
 * to call the backend auth API. Then injects the JWT into localStorage.
 *
 * Flow:
 * 1. Navigate to the app (triggers dev tunnel auth via cookies)
 * 2. page.evaluate() calls /api/auth/challenge from within the browser
 * 3. Sign the challenge server-side with derived secret key
 * 4. page.evaluate() calls /api/auth/verify → gets JWT
 * 5. Write JWT + wallet state to localStorage
 */
export async function authenticateWallet(page: Page, wallet: WalletConfig): Promise<void> {
  const publicKey = await resolvePublicKey(wallet);
  const secretKey = await deriveSecretKey(wallet);

  if (!secretKey) {
    throw new Error(`[Auth] No secret key for ${publicKey.slice(0, 8)}...`);
  }

  // Navigate first so dev tunnel cookies are active
  await page.goto("/chat/new", { waitUntil: "networkidle" });

  // Step 1: Get challenge nonce (from within the page context — has tunnel cookies)
  const challenge = await page.evaluate(async (pubKey: string) => {
    const res = await fetch(`${window.location.origin}/api/auth/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey: pubKey }),
    });
    if (!res.ok) throw new Error(`Challenge failed: ${res.status}`);
    const json = await res.json();
    return json.data.challenge as string;
  }, publicKey);

  console.log(`[Auth] Got challenge for ${publicKey.slice(0, 8)}...`);

  // Step 2: Build and sign TX server-side (Node.js — has the secret key)
  const { Keypair, TransactionBuilder, Operation, Account } = await import("@stellar/stellar-sdk");
  const keypair = Keypair.fromSecret(secretKey);
  const account = new Account(publicKey, "0");
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.manageData({ name: "tasmil auth", value: challenge }))
    .setTimeout(300)
    .build();

  tx.sign(keypair);
  const signedXdr = tx.toXDR();

  // Step 3: Verify and get JWT (from within the page context)
  const authResult = await page.evaluate(
    async (params: { publicKey: string; signedXdr: string }) => {
      const res = await fetch(`${window.location.origin}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
      const json = await res.json();
      return json.data as { accessToken: string; user: any };
    },
    { publicKey, signedXdr }
  );

  console.log(`[Auth] JWT obtained for ${publicKey.slice(0, 8)}... ✅`);

  // Step 4: Write to localStorage and reload
  await page.evaluate(
    (params: { publicKey: string; accessToken: string; user: any }) => {
      // Wallet store (Zustand key: "wallet-storage")
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({
          state: { connected: true, account: params.publicKey, signing: false },
          version: 0,
        })
      );

      // Auth store (Zustand key: "auth-storage")
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: params.accessToken,
            user: {
              id: params.user?.id || `user_${params.publicKey.slice(0, 8)}`,
              walletAddress: params.publicKey,
              type: params.user?.type || "regular",
              createdAt: params.user?.createdAt || new Date().toISOString(),
              updatedAt: params.user?.updatedAt || new Date().toISOString(),
            },
            isLoading: false,
            expiresAt: Date.now() + 23 * 60 * 60 * 1000,
          },
          version: 0,
        })
      );
    },
    { publicKey, accessToken: authResult.accessToken, user: authResult.user }
  );
}

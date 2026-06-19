import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";

export const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
export const DEV_WALLET = "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R";
export const DEV_TOKEN = "dev-bypass-token";

if (DEV_BYPASS && typeof window !== "undefined") {
  useAuthStore.getState().setAuthState({
    accessToken: DEV_TOKEN,
    user: {
      id: "dev-user",
      walletAddress: DEV_WALLET,
      type: "guest",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  useWalletStore.getState().setWalletState({ connected: true, account: DEV_WALLET });
}

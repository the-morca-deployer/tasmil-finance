import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";

export const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
export const DEV_WALLET = "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R";
export const DEV_TOKEN = "dev-bypass-token";

// Set by disconnectAll() so an explicit Disconnect actually sticks under
// dev-bypass - otherwise dev-bypass would force-reconnect on the next page
// load. Cleared on an explicit connect.
export const DEV_DISCONNECTED_KEY = "tasmil.dev-disconnected";

export function isDevBypassDisconnected(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(DEV_DISCONNECTED_KEY) === "1";
  } catch {
    return false;
  }
}

if (DEV_BYPASS && typeof window !== "undefined" && !isDevBypassDisconnected()) {
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

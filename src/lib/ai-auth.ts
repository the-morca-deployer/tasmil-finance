import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";

type AiIdentityOptions = {
  accessToken?: string | null;
  walletAddress?: string | null;
};

export function buildAiIdentityHeaders({
  accessToken,
  walletAddress,
}: AiIdentityOptions): Record<string, string> {
  const headers: Record<string, string> = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (walletAddress) {
    headers["X-Chat-Wallet-Address"] = walletAddress;
  }

  return headers;
}

export function getAiIdentityHeaders(): Record<string, string> {
  return buildAiIdentityHeaders({
    accessToken: useAuthStore.getState().accessToken,
    walletAddress: useWalletStore.getState().account,
  });
}

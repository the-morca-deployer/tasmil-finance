import { useAuthStore } from "@/store/use-auth";

export function buildAiAuthHeaders(accessToken?: string | null): Record<string, string> {
  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export function getAiAuthHeaders(): Record<string, string> {
  return buildAiAuthHeaders(useAuthStore.getState().accessToken);
}

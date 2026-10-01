"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import backendAxios from "@/lib/kubb-backend";

/** Must match backend `BETA_TERMS_VERSION` (src/modules/beta/beta.service.ts). */
export const BETA_TERMS_VERSION = "sow2-guarded-beta-2026-10";

export interface BetaOptInStatus {
  optedIn: boolean;
  termsVersion: string;
  acceptedAt: string | null;
}

const KEY = ["beta", "opt-in"] as const;

/** Whether the connected wallet accepted the current guarded-beta terms. */
export function useBetaOptInStatus(enabled: boolean) {
  return useQuery({
    queryKey: KEY,
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await backendAxios.get<{ data: BetaOptInStatus }>("/api/beta/opt-in");
      return data.data;
    },
  });
}

/** Records explicit opt-in; vault creation is refused by the backend without it. */
export function useAcceptBetaTerms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await backendAxios.post<{ data: BetaOptInStatus }>("/api/beta/opt-in", {
        termsVersion: BETA_TERMS_VERSION,
      });
      return data.data;
    },
    onSuccess: (status) => queryClient.setQueryData(KEY, status),
  });
}

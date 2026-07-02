"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";

export type ReferralSegment = "NORMAL" | "KOL" | "INFLUENCER";

export const REFERRAL_SEGMENTS: ReferralSegment[] = ["NORMAL", "KOL", "INFLUENCER"];
export const REFERRAL_LAYERS = [1, 2, 3] as const;

export interface ReferralConfigRow {
  layer: number;
  segment: ReferralSegment;
  rateBps: number;
  isActive: boolean;
}

export interface UpdateReferralConfigInput {
  layer: number;
  segment: ReferralSegment;
  rateBps: number;
  isActive?: boolean;
}

const CONFIG_KEY = ["admin-referral-config"] as const;

export function useReferralConfig() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<ReferralConfigRow[]>({
    queryKey: CONFIG_KEY,
    queryFn: () => adminFetch<ReferralConfigRow[]>("/api/admin/quest-referral/config"),
    enabled: !!token,
  });
}

export function useUpdateReferralConfig() {
  const queryClient = useQueryClient();
  return useMutation<ReferralConfigRow, Error, UpdateReferralConfigInput>({
    mutationFn: ({ layer, segment, rateBps, isActive }) =>
      adminFetch<ReferralConfigRow>(`/api/admin/quest-referral/config/${layer}/${segment}`, {
        method: "PATCH",
        body: { rateBps, isActive },
      }),
    onSuccess: (_row, vars) => {
      queryClient.invalidateQueries({ queryKey: CONFIG_KEY });
      toast.success(`Layer ${vars.layer} ${vars.segment} rate saved`);
    },
    onError: (error) => {
      toast.error("Failed to save commission rate", { description: error.message });
    },
  });
}

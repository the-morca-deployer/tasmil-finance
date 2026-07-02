"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";
import type { ReferralSegment } from "./use-admin-referral-config";

export interface UserOverride {
  layer: number;
  rateBps: number;
  isActive: boolean;
}

export interface QuestUserLookup {
  userId: string;
  walletAddress: string;
  username: string | null;
  segment: ReferralSegment;
  totalPoints: number;
  tier: string;
  overrides: UserOverride[];
}

const userKey = (wallet: string) => ["admin-quest-user", wallet] as const;

export function useQuestUserLookup(wallet: string | null) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<QuestUserLookup, Error>({
    queryKey: userKey(wallet ?? ""),
    queryFn: () =>
      adminFetch<QuestUserLookup>(
        `/api/admin/quest-referral/users/lookup?wallet=${encodeURIComponent(wallet ?? "")}`
      ),
    enabled: !!token && !!wallet,
    retry: false,
  });
}

export function useSetUserSegment() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { userId: string; segment: ReferralSegment }>({
    mutationFn: ({ userId, segment }) =>
      adminFetch(`/api/admin/quest-referral/users/${userId}/segment`, {
        method: "PATCH",
        body: { segment },
      }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-user"] });
      toast.success(`Segment set to ${vars.segment}`);
    },
    onError: (error) => toast.error("Failed to set segment", { description: error.message }),
  });
}

export interface OverrideInput {
  layer: number;
  rateBps: number;
  isActive?: boolean;
}

export function useReplaceUserOverrides() {
  const queryClient = useQueryClient();
  return useMutation<UserOverride[], Error, { userId: string; overrides: OverrideInput[] }>({
    mutationFn: ({ userId, overrides }) =>
      adminFetch<UserOverride[]>(`/api/admin/quest-referral/users/${userId}/override`, {
        method: "PUT",
        body: { overrides },
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-user"] });
      toast.success(res.length === 0 ? "All overrides removed" : `${res.length} override(s) saved`);
    },
    onError: (error) => toast.error("Failed to save overrides", { description: error.message }),
  });
}

export function useDeleteUserOverride() {
  const queryClient = useQueryClient();
  return useMutation<{ deleted: boolean }, Error, { userId: string; layer: number }>({
    mutationFn: ({ userId, layer }) =>
      adminFetch<{ deleted: boolean }>(
        `/api/admin/quest-referral/users/${userId}/override/${layer}`,
        { method: "DELETE" }
      ),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-user"] });
      toast.success(`Layer ${vars.layer} override removed`);
    },
    onError: (error) => toast.error("Failed to remove override", { description: error.message }),
  });
}

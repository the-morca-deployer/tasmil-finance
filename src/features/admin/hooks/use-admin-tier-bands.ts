"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";

export interface TierBandRow {
  tier: string;
  min: number;
}

export interface UpdateTierBandInput {
  tier: string;
  min: number;
}

const QUERY_KEY = ["admin-tier-bands"] as const;

export function useTierBands() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<TierBandRow[]>({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch<TierBandRow[]>("/api/admin/tier-bands"),
    enabled: !!token,
  });
}

export function useUpdateTierBand() {
  const queryClient = useQueryClient();
  return useMutation<TierBandRow, Error, UpdateTierBandInput>({
    mutationFn: ({ tier, min }) =>
      adminFetch<TierBandRow>(`/api/admin/tier-bands/${tier}`, {
        method: "PATCH",
        body: { min },
      }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(`${row.tier} threshold updated to ${row.min.toLocaleString()} pts`);
    },
    onError: (error) => {
      toast.error("Failed to update tier threshold", { description: error.message });
    },
  });
}

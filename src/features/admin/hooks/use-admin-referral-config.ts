"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";

export interface ReferralConfigRow {
  layer: number;
  rateBps: number;
  isActive: boolean;
}

export interface UpdateReferralConfigInput {
  layer: number;
  rateBps: number;
  isActive?: boolean;
}

const QUERY_KEY = ["admin-referral-config"] as const;

export function useReferralConfig() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<ReferralConfigRow[]>({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch<ReferralConfigRow[]>("/api/admin/referral/config"),
    enabled: !!token,
  });
}

export function useUpdateReferralConfig() {
  const queryClient = useQueryClient();
  return useMutation<ReferralConfigRow, Error, UpdateReferralConfigInput>({
    mutationFn: ({ layer, rateBps, isActive }) =>
      adminFetch<ReferralConfigRow>(`/api/admin/referral/config/${layer}`, {
        method: "PATCH",
        body: { rateBps, isActive },
      }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(`Layer ${row.layer} commission rate updated`);
    },
    onError: (error) => {
      toast.error("Failed to update commission rate", { description: error.message });
    },
  });
}

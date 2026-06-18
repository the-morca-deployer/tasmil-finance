"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";

export interface SponsorConfig {
  id: number;
  rule: string;
  maxSlots: number;
  maxTxPerUserPerDay: number;
  active: boolean;
  currentSlots: number;
}

export interface SponsorStats {
  total: number;
  totalFeeXlm: number;
  byType: { onboarding: number; ai_chat: number };
  slotUsage: number;
}

export interface SponsorLog {
  id: number;
  publicKey: string;
  txHash: string;
  feeXlm: number;
  txType: string;
  createdAt: string;
}

export interface SponsorLogsResponse {
  data: SponsorLog[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateSponsorConfigDto {
  maxSlots?: number;
  maxTxPerUserPerDay?: number;
  active?: boolean;
  rule?: string;
}

export function useSponsorConfig() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<SponsorConfig>({
    queryKey: ["admin-sponsor-config"],
    queryFn: () => adminFetch<SponsorConfig>("/api/admin/sponsor/config"),
    enabled: !!token,
  });
}

export function useUpdateSponsorConfig() {
  const queryClient = useQueryClient();
  return useMutation<SponsorConfig, Error, UpdateSponsorConfigDto>({
    mutationFn: (dto) =>
      adminFetch<SponsorConfig>("/api/admin/sponsor/config", { method: "PATCH", body: dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sponsor-config"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sponsor-stats"] });
      toast.success("Sponsor config updated");
    },
    onError: (error) => {
      toast.error("Update failed", { description: error.message });
    },
  });
}

export function useSponsorStats() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<SponsorStats>({
    queryKey: ["admin-sponsor-stats"],
    queryFn: () => adminFetch<SponsorStats>("/api/admin/sponsor/stats"),
    enabled: !!token,
    refetchInterval: 30000,
  });
}

export function useSponsorLogs(page: number, limit: number) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<SponsorLogsResponse>({
    queryKey: ["admin-sponsor-logs", page, limit],
    queryFn: () =>
      adminFetch<SponsorLogsResponse>(`/api/admin/sponsor/logs?page=${page}&limit=${limit}`),
    enabled: !!token,
    placeholderData: (prev) => prev,
  });
}

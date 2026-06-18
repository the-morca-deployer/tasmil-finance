"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";

// ── Backend response shapes ────────────────────────────────────────────────

interface BackendConfig {
  id: number;
  rule: string;
  maxSlots: number;
  maxTxPerUserPerDay: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BackendConfigResponse {
  config: BackendConfig | null;
  usedSlots: number;
}

interface BackendStatsByType {
  txType: string;
  count: number;
  feeXlm: number;
}

interface BackendStats {
  totalSponsored: number;
  totalFeeXlm: number;
  usedSlots: number;
  maxSlots: number;
  byType: BackendStatsByType[];
}

interface BackendLog {
  id: number;
  publicKey: string;
  txHash: string;
  feeXlm: number;
  txType: string;
  createdAt: string;
}

interface BackendLogsResponse {
  items: BackendLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Public types (used by UI) ──────────────────────────────────────────────

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

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useSponsorConfig() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<SponsorConfig>({
    queryKey: ["admin-sponsor-config"],
    queryFn: async () => {
      const res = await adminFetch<BackendConfigResponse>("/api/admin/sponsor/config");
      const cfg = res.config;
      if (!cfg) throw new Error("No sponsor config");
      return { ...cfg, currentSlots: res.usedSlots };
    },
    enabled: !!token,
  });
}

export function useUpdateSponsorConfig() {
  const queryClient = useQueryClient();
  return useMutation<BackendConfig, Error, UpdateSponsorConfigDto>({
    mutationFn: (dto) =>
      adminFetch<BackendConfig>("/api/admin/sponsor/config", { method: "PATCH", body: dto }),
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
    queryFn: async () => {
      const res = await adminFetch<BackendStats>("/api/admin/sponsor/stats");
      const onboarding = res.byType.find((b) => b.txType === "onboarding")?.count ?? 0;
      const ai_chat = res.byType.find((b) => b.txType === "ai_chat")?.count ?? 0;
      const slotUsage = res.maxSlots > 0 ? res.usedSlots / res.maxSlots : 0;
      return {
        total: res.totalSponsored,
        totalFeeXlm: res.totalFeeXlm,
        byType: { onboarding, ai_chat },
        slotUsage,
      };
    },
    enabled: !!token,
    refetchInterval: 30000,
  });
}

export function useSponsorLogs(page: number, limit: number) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<SponsorLogsResponse>({
    queryKey: ["admin-sponsor-logs", page, limit],
    queryFn: async () => {
      const res = await adminFetch<BackendLogsResponse>(
        `/api/admin/sponsor/logs?page=${page}&limit=${limit}`
      );
      return { data: res.items, total: res.total, page: res.page, limit: res.limit };
    },
    enabled: !!token,
    placeholderData: (prev) => prev,
  });
}

export interface SponsorBalance {
  balance: number;
  publicKey: string;
}

export function useSponsorBalance() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<SponsorBalance>({
    queryKey: ["admin-sponsor-balance"],
    queryFn: () => adminFetch<SponsorBalance>("/api/admin/sponsor/balance"),
    enabled: !!token,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useResetSponsorSlots() {
  const queryClient = useQueryClient();
  return useMutation<{ reset: boolean; configId: number }, Error>({
    mutationFn: () =>
      adminFetch<{ reset: boolean; configId: number }>("/api/admin/sponsor/reset-slots", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sponsor-config"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sponsor-stats"] });
      toast.success("Slot counter reset to 0");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useTestTelegramAlert() {
  return useMutation<{ sent: boolean }, Error>({
    mutationFn: () =>
      adminFetch<{ sent: boolean }>("/api/admin/sponsor/test-alert", { method: "POST" }),
    onSuccess: () => toast.success("Test alert sent — check your Telegram"),
    onError: (err) => toast.error(`Alert failed: ${err.message}`),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";

export type SeasonStatus = "ACTIVE" | "ENDED" | "REVEALED";
export type PayoutStatus = "PENDING" | "PAID";

export interface SeasonRankReward {
  rankFrom: number;
  rankTo: number;
  usdc: string;
  points: number;
  badge?: string | null;
}

export interface SeasonView {
  id: string;
  name: string;
  status: SeasonStatus;
  startAt: string;
  endAt: string;
  prizePoolUsdc: string;
  rankRewards: SeasonRankReward[];
}

export interface SeasonResultRow {
  id: string;
  userId: string;
  walletAddress: string;
  username: string | null;
  email: string | null;
  finalRank: number;
  finalPoints: number;
  usdcReward: string;
  pointsReward: number;
  payoutStatus: PayoutStatus;
  paidTxHash: string | null;
  paidAt: string | null;
  notifiedAt: string | null;
  emailSentAt: string | null;
  revealedAt: string | null;
}

export interface SeasonResultsPage {
  items: SeasonResultRow[];
  total: number;
}

export interface CreateSeasonInput {
  name: string;
  startAt: string;
  endAt: string;
  prizePoolUsdc?: string;
}

export interface UpdateSeasonInput {
  name?: string;
  startAt?: string;
  endAt?: string;
  prizePoolUsdc?: string;
  status?: SeasonStatus;
}

export interface BatchPayoutItem {
  resultId: string;
  paidTxHash?: string;
}

export interface BatchPayoutResponse {
  results: { resultId: string; success: boolean; error?: string }[];
}

const SEASONS_KEY = ["admin-seasons"] as const;
const resultsKey = (seasonId: string) => ["admin-season-results", seasonId] as const;

export function useAdminSeasons() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<SeasonView[]>({
    queryKey: SEASONS_KEY,
    queryFn: () => adminFetch<SeasonView[]>("/api/admin/quest-seasons"),
    enabled: !!token,
  });
}

export function useSeasonResults(seasonId: string | null, page = 1, limit = 50) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<SeasonResultsPage>({
    queryKey: [...resultsKey(seasonId ?? ""), page, limit],
    queryFn: () =>
      adminFetch<SeasonResultsPage>(
        `/api/admin/quest-seasons/${seasonId}/results?page=${page}&limit=${limit}`
      ),
    enabled: !!token && !!seasonId,
  });
}

export function useCreateSeason() {
  const queryClient = useQueryClient();
  // Backend returns raw unmapped rows (Decimal fields not stringified, rankRewards absent);
  // do not consume without mapping.
  return useMutation<unknown, Error, CreateSeasonInput>({
    mutationFn: (data) =>
      adminFetch<unknown>("/api/admin/quest-seasons", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEASONS_KEY });
      toast.success("Season created");
    },
    onError: (error) => toast.error("Failed to create season", { description: error.message }),
  });
}

export function useUpdateSeason(id: string) {
  const queryClient = useQueryClient();
  // Backend returns raw unmapped rows (Decimal fields not stringified, rankRewards absent);
  // do not consume without mapping.
  return useMutation<unknown, Error, UpdateSeasonInput>({
    mutationFn: (data) =>
      adminFetch<unknown>(`/api/admin/quest-seasons/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEASONS_KEY });
      toast.success("Season updated");
    },
    onError: (error) => toast.error("Failed to update season", { description: error.message }),
  });
}

export function useEndSeason() {
  const queryClient = useQueryClient();
  return useMutation<SeasonView, Error, string>({
    mutationFn: (id) =>
      adminFetch<SeasonView>(`/api/admin/quest-seasons/${id}/end`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEASONS_KEY });
      toast.success("Season ended");
    },
    onError: (error) => toast.error("Failed to end season", { description: error.message }),
  });
}

export function useSetRankRewards(id: string) {
  const queryClient = useQueryClient();
  return useMutation<SeasonRankReward[], Error, { rewards: SeasonRankReward[] }>({
    mutationFn: (body) =>
      adminFetch<SeasonRankReward[]>(`/api/admin/quest-seasons/${id}/rank-rewards`, {
        method: "PUT",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEASONS_KEY });
      toast.success("Rank rewards saved");
    },
    onError: (error) => toast.error("Failed to save rank rewards", { description: error.message }),
  });
}

export function useMarkPayout(seasonId: string) {
  const queryClient = useQueryClient();
  // Backend returns raw unmapped rows (Decimal fields not stringified, rankRewards absent);
  // do not consume without mapping.
  return useMutation<unknown, Error, { resultId: string; paidTxHash?: string }>({
    mutationFn: ({ resultId, paidTxHash }) =>
      adminFetch<unknown>(`/api/admin/quest-seasons/results/${resultId}/payout`, {
        method: "PATCH",
        body: paidTxHash ? { paidTxHash } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resultsKey(seasonId) });
      toast.success("Payout marked paid");
    },
    onError: (error) => toast.error("Failed to mark payout", { description: error.message }),
  });
}

export function useBatchPayout(seasonId: string) {
  const queryClient = useQueryClient();
  return useMutation<BatchPayoutResponse, Error, BatchPayoutItem[]>({
    mutationFn: (items) =>
      adminFetch<BatchPayoutResponse>("/api/admin/quest-seasons/results/batch-payout", {
        method: "PATCH",
        body: { items },
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: resultsKey(seasonId) });
      const ok = res.results.filter((r) => r.success).length;
      const failed = res.results.length - ok;
      if (failed === 0) toast.success(`${ok} payouts marked paid`);
      else toast.warning(`${ok} paid, ${failed} failed`);
    },
    onError: (error) => toast.error("Batch payout failed", { description: error.message }),
  });
}

export function useResendNotification(seasonId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ notified: boolean }, Error, string>({
    mutationFn: (resultId) =>
      adminFetch<{ notified: boolean }>(
        `/api/admin/quest-seasons/results/${resultId}/resend-notification`,
        { method: "POST" }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: resultsKey(seasonId) });
      toast[res.notified ? "success" : "warning"](
        res.notified ? "Notification resent" : "Notification could not be resent"
      );
    },
    onError: (error) =>
      toast.error("Failed to resend notification", { description: error.message }),
  });
}

export function useResendEmail(seasonId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ sent: boolean }, Error, string>({
    mutationFn: (resultId) =>
      adminFetch<{ sent: boolean }>(`/api/admin/quest-seasons/results/${resultId}/resend-email`, {
        method: "POST",
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: resultsKey(seasonId) });
      toast[res.sent ? "success" : "warning"](
        res.sent ? "Email resent" : "Email not sent (no address on file)"
      );
    },
    onError: (error) => toast.error("Failed to resend email", { description: error.message }),
  });
}

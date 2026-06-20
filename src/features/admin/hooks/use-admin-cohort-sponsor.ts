"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminFetch } from "../lib/admin-fetch";

// ── Backend response shapes (mirrors AdminSponsorshipController) ───────────

export interface CohortConfig {
  id: number;
  enabled: boolean;
  cohortSize: number;
  maxTxPerUser: number;
  maxXlmPerTx: string; // Prisma Decimal serializes as string
  network: "mainnet" | "testnet";
  version: number;
  updatedAt: string;
  updatedByUserId: string | null;
}

export interface CohortMember {
  userId: string;
  rank: number;
  assignedAt: string;
  modalSeenAt: string | null;
  txCount: number;
  xlmSponsoredStroops: string;
  lastSponsoredAt: string | null;
}

export type CohortFallbackReason =
  | "not_enrolled"
  | "disabled"
  | "tx_quota_exhausted"
  | "fee_over_cap"
  | "sponsor_balance_low"
  | "sponsor_sign_failed"
  | "feebump_submit_failed"
  | "horizon_error"
  | "feebump_indirect_success";

export interface CohortFallbackRow {
  id: string;
  userId: string | null;
  txHash: string | null;
  reason: CohortFallbackReason;
  meta: unknown;
  createdAt: string;
}

interface MembersPage {
  members: CohortMember[];
  nextCursor: number | null;
}

interface FallbackPage {
  rows: CohortFallbackRow[];
  nextCursor: string | null;
}

interface PatchConfigBody {
  cohortSize?: number;
  maxTxPerUser?: number;
  maxXlmPerTx?: string;
  enabled?: boolean;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useCohortConfig() {
  return useQuery({
    queryKey: ["admin", "cohort-sponsor", "config"],
    queryFn: () => adminFetch<CohortConfig>("/api/admin/sponsorship/config"),
    staleTime: 30_000,
  });
}

export function useUpdateCohortConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PatchConfigBody) =>
      adminFetch<CohortConfig>("/api/admin/sponsorship/config", {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cohort-sponsor", "config"] });
      qc.invalidateQueries({ queryKey: ["admin", "cohort-sponsor", "members"] });
      toast.success("Cohort sponsorship config updated");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update cohort config");
    },
  });
}

export function useCohortMembers(limit = 50) {
  return useQuery({
    queryKey: ["admin", "cohort-sponsor", "members", limit],
    queryFn: () => adminFetch<MembersPage>(`/api/admin/sponsorship/members?limit=${limit}`),
    staleTime: 30_000,
  });
}

export function useCohortFallbackLog(limit = 50) {
  return useQuery({
    queryKey: ["admin", "cohort-sponsor", "fallback", limit],
    queryFn: () => adminFetch<FallbackPage>(`/api/admin/sponsorship/fallback-log?limit=${limit}`),
    staleTime: 30_000,
  });
}

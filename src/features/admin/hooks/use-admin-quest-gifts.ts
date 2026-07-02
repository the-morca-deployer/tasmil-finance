"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";
import type { ReferralSegment } from "./use-admin-referral-config";

export type GiftTargetType = "WALLET" | "SEGMENT" | "TIER";
export type PayoutStatus = "PENDING" | "PAID";
export type UserTier =
  | "UNRANKED"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER";

export const GIFT_TARGET_TYPES: GiftTargetType[] = ["WALLET", "SEGMENT", "TIER"];
export const USER_TIERS: UserTier[] = [
  "UNRANKED",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
];

export interface GiftListRow {
  id: string;
  title: string;
  points: number;
  usdc: string;
  targetType: GiftTargetType;
  createdAt: string;
  recipientCount: number;
  paidCount: number;
  pendingCount: number;
  totalPointsAwarded: number;
  totalUsdcAwarded: string;
}

export interface CreateGiftInput {
  title: string;
  points?: number;
  usdc?: string;
  targetType: GiftTargetType;
  targetWallets?: string[];
  targetSegment?: ReferralSegment;
  targetTier?: UserTier;
}

export interface CreateGiftResponse {
  giftId: string;
  recipientCount: number;
  pointsCredited: boolean;
  targetType: GiftTargetType;
}

export interface GiftRecipientRow {
  id: string;
  userId: string;
  walletAddress: string | null;
  username: string | null;
  email: string | null;
  pointsAwarded: number;
  usdcAwarded: string;
  payoutStatus: PayoutStatus;
  paidTxHash: string | null;
  paidAt: string | null;
  notifiedAt: string | null;
  emailSentAt: string | null;
}

export interface GiftRecipientsPage {
  items: GiftRecipientRow[];
  total: number;
}

export interface BatchGiftPayoutItem {
  recipientId: string;
  paidTxHash?: string;
}

export interface BatchGiftPayoutResponse {
  results: { recipientId: string; success: boolean; error?: string }[];
}

const GIFTS_KEY = ["admin-quest-gifts"] as const;
const recipientsKey = (giftId: string) => ["admin-gift-recipients", giftId] as const;

export function useAdminGifts() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<GiftListRow[]>({
    queryKey: GIFTS_KEY,
    queryFn: () => adminFetch<GiftListRow[]>("/api/admin/quest-gifts"),
    enabled: !!token,
  });
}

export function useGiftRecipients(giftId: string | null, page = 1, pageSize = 50) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<GiftRecipientsPage>({
    queryKey: [...recipientsKey(giftId ?? ""), page, pageSize],
    queryFn: () =>
      adminFetch<GiftRecipientsPage>(
        `/api/admin/quest-gifts/${giftId}/recipients?page=${page}&pageSize=${pageSize}`
      ),
    enabled: !!token && !!giftId,
  });
}

export function useCreateGift() {
  const queryClient = useQueryClient();
  return useMutation<CreateGiftResponse, Error, CreateGiftInput>({
    mutationFn: (data) =>
      adminFetch<CreateGiftResponse>("/api/admin/quest-gifts", { method: "POST", body: data }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: GIFTS_KEY });
      if (res.recipientCount === 0) {
        toast.warning("Gift created with 0 recipients. No wallets resolved to quest users.");
      } else {
        toast.success(`Gift created with ${res.recipientCount} recipient(s)`);
      }
    },
    onError: (error) => toast.error("Failed to create gift", { description: error.message }),
  });
}

export function useMarkGiftPayout(giftId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { recipientId: string; paidTxHash?: string }>({
    mutationFn: ({ recipientId, paidTxHash }) =>
      adminFetch(`/api/admin/quest-gifts/recipients/${recipientId}/payout`, {
        method: "PATCH",
        body: paidTxHash ? { paidTxHash } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipientsKey(giftId) });
      queryClient.invalidateQueries({ queryKey: GIFTS_KEY });
      toast.success("Payout marked paid");
    },
    onError: (error) => toast.error("Failed to mark payout", { description: error.message }),
  });
}

export function useBatchGiftPayout(giftId: string) {
  const queryClient = useQueryClient();
  return useMutation<BatchGiftPayoutResponse, Error, BatchGiftPayoutItem[]>({
    mutationFn: (items) =>
      adminFetch<BatchGiftPayoutResponse>("/api/admin/quest-gifts/recipients/batch-payout", {
        method: "PATCH",
        body: { items },
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: recipientsKey(giftId) });
      queryClient.invalidateQueries({ queryKey: GIFTS_KEY });
      const ok = res.results.filter((r) => r.success).length;
      const failed = res.results.length - ok;
      if (failed === 0) toast.success(`${ok} payouts marked paid`);
      else toast.warning(`${ok} paid, ${failed} failed`);
    },
    onError: (error) => toast.error("Batch payout failed", { description: error.message }),
  });
}

export function useResendGiftNotification(giftId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ notified: boolean }, Error, string>({
    mutationFn: (recipientId) =>
      adminFetch<{ notified: boolean }>(
        `/api/admin/quest-gifts/recipients/${recipientId}/resend-notification`,
        { method: "POST" }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: recipientsKey(giftId) });
      toast[res.notified ? "success" : "warning"](
        res.notified ? "Notification resent" : "Notification could not be resent"
      );
    },
    onError: (error) =>
      toast.error("Failed to resend notification", { description: error.message }),
  });
}

export function useResendGiftEmail(giftId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ sent: boolean }, Error, string>({
    mutationFn: (recipientId) =>
      adminFetch<{ sent: boolean }>(
        `/api/admin/quest-gifts/recipients/${recipientId}/resend-email`,
        { method: "POST" }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: recipientsKey(giftId) });
      toast[res.sent ? "success" : "warning"](
        res.sent ? "Email resent" : "Email not sent (no address on file)"
      );
    },
    onError: (error) => toast.error("Failed to resend email", { description: error.message }),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";
import type {
  BulkSendResult,
  EmailDispatch,
  WaitlistEntriesResponse,
  WaitlistStatus,
} from "../types";

export interface WaitlistQuery {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export function useWaitlistEntries(params: WaitlistQuery) {
  const token = useAdminAuthStore((s) => s.token);
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);

  return useQuery<WaitlistEntriesResponse>({
    queryKey: ["admin-waitlist", params],
    queryFn: () =>
      adminFetch<WaitlistEntriesResponse>(`/api/admin/waitlist/entries?${qs.toString()}`),
    enabled: !!token,
    placeholderData: (prev: WaitlistEntriesResponse | undefined) => prev,
  });
}

export function useUpdateWaitlistEntry() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { id: string; status: WaitlistStatus }>({
    mutationFn: ({ id, status }) =>
      adminFetch(`/api/admin/waitlist/entries/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Status updated");
    },
    onError: (error) => {
      toast.error("Update failed", { description: error.message });
    },
  });
}

export function useWaitlistDispatches(entryId: string | null) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<EmailDispatch[]>({
    queryKey: ["admin-waitlist-dispatches", entryId],
    queryFn: () => adminFetch<EmailDispatch[]>(`/api/admin/waitlist/entries/${entryId}/dispatches`),
    enabled: !!token && !!entryId,
  });
}

export function useBulkSendAccess() {
  const queryClient = useQueryClient();
  return useMutation<BulkSendResult, Error, { entryIds: string[] }>({
    mutationFn: ({ entryIds }) =>
      adminFetch<BulkSendResult>("/api/admin/waitlist/bulk-send-access", {
        method: "POST",
        body: { entryIds },
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(`Sent ${result.sent} access emails`, {
        description: result.failed > 0 ? `${result.failed} failed` : undefined,
      });
    },
    onError: (error) => {
      toast.error("Bulk send failed", { description: error.message });
    },
  });
}

export function useSendAccessToEntry() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { entryId: string; email: string }>({
    mutationFn: async ({ entryId, email }) => {
      const codeRes = await adminFetch<{ id: string; code: string }>(
        "/api/admin/access-codes/individual",
        { method: "POST", body: { waitlistEntryId: entryId } }
      );
      return adminFetch("/api/admin/access-codes/send-email", {
        method: "POST",
        body: { email, code: codeRes.code },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      toast.success("Access email sent");
    },
    onError: (error) => {
      toast.error("Failed to send access email", { description: error.message });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";
import type { WaitlistEntriesResponse, WaitlistStatus } from "../types";

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

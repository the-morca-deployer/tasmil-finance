"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminFetch } from "../lib/admin-fetch";

export interface AdminSettings {
  /** When true, wallet login/refresh requires a redeemed access code. */
  waitlistMode: boolean;
}

const KEY = ["admin", "settings"] as const;

export function useAdminSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => adminFetch<AdminSettings>("/api/admin/settings"),
  });
}

export function useUpdateWaitlistMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (waitlistMode: boolean) =>
      adminFetch<AdminSettings>("/api/admin/settings", {
        method: "PUT",
        body: { waitlistMode },
      }),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
      toast.success(`Waitlist mode ${data.waitlistMode ? "enabled" : "disabled"}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/features/admin-auth/store/use-admin-auth-store";

interface DashboardStats {
  waitlist: { last24h: number; last7d: number; allTime: number };
  emailDispatches: {
    confirmationSent: number;
    confirmationFailed: number;
    accessSent: number;
    accessFailed: number;
  };
  accessCodes: { total: number; active: number; exhausted: number };
  campaigns: { total: number; completed: number; failed: number };
}

async function fetchDashboard(token: string): Promise<DashboardStats> {
  const response = await fetch("/api/admin/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return response.json();
}

export function useAdminDashboard() {
  const token = useAdminAuthStore((s) => s.token);

  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchDashboard(token!),
    enabled: !!token,
    refetchInterval: 30_000,
  });
}
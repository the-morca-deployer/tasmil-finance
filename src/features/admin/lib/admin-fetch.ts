import { useAdminAuthStore } from "@/store/use-admin-auth";

export interface AdminFetchOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function adminFetch<T = unknown>(
  path: string,
  opts: AdminFetchOptions = {}
): Promise<T> {
  const token = opts.token ?? useAdminAuthStore.getState().token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (res.status === 401) {
    useAdminAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") window.location.assign("/admin/login");
    throw new Error(json?.message ?? "Session expired");
  }

  if (!res.ok) {
    throw new Error(json?.message ?? `HTTP ${res.status}`);
  }

  return (json?.data ?? json) as T;
}

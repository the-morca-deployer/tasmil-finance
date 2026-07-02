import { useAdminAuthStore } from "@/store/use-admin-auth";

/**
 * Fetch an admin CSV/binary endpoint with the admin JWT and trigger a browser
 * download named from the Content-Disposition header.
 */
export async function adminDownload(path: string): Promise<void> {
  const token = useAdminAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { headers });

  if (res.status === 401) {
    useAdminAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") window.location.assign("/admin/login");
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(json?.message ?? `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/.exec(disposition);
  const filename = match?.[1] ?? `export-${new Date().toISOString().slice(0, 10)}.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

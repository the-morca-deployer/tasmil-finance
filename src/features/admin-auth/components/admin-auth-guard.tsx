"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuthStore } from "@/store/use-admin-auth";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function isAdminAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem("admin-auth-storage");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const token: string | undefined = parsed.state?.token;
    if (!parsed.state?.isAuthenticated || !token) return false;
    return !isTokenExpired(token);
  } catch {
    return false;
  }
}

function AdminLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      useAdminAuthStore.getState().clearAuth();
      router.push("/admin/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  // React to clearAuth() called from adminFetch on mid-session 401
  useEffect(() => {
    if (checked && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, checked, router]);

  if (!checked) {
    return <AdminLoadingState />;
  }

  return <>{children}</>;
}

"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMyAgents } from "@/features/marketplace/hooks/use-marketplace-api";

export function RequireVaultGuard({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useMyAgents();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!data || data.length === 0)) {
      router.replace("/onboarding");
    }
  }, [data, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return <>{children}</>;
}

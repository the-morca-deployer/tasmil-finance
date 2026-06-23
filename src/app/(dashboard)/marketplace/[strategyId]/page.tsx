"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { StrategyDetail } from "@/features/marketplace";
import { useStrategyDetail, useStrategyPerformance } from "@/features/marketplace/hooks/use-marketplace-api";

export default function StrategyDetailRoute() {
  const params = useParams();
  const router = useRouter();
  const id = params.strategyId as string;

  const { data: strategy, isLoading, error } = useStrategyDetail(id);
  const { data: performance, isLoading: perfLoading } = useStrategyPerformance(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="py-24 text-center text-sm text-red-400">
        Strategy not found
      </div>
    );
  }

  const handleActivate = async () => {
    try {
      const res = await fetch(`/api/marketplace/strategies/${id}/activate`, { method: "POST" });
      const json = await res.json();
      if (json.success) window.location.reload();
    } catch (e) {
      console.error("Activation failed", e);
    }
  };

  return (
    <StrategyDetail
      strategy={strategy}
      performance={performance ?? []}
      loading={perfLoading}
      onActivate={handleActivate}
      onBack={() => router.push("/marketplace")}
    />
  );
}

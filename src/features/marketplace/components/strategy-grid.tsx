"use client";

import { motion } from "framer-motion";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { MarketplaceStrategy } from "@/features/marketplace/types";
import { StrategyCard } from "@/features/marketplace/components/strategy-card";

interface StrategyGridProps {
  strategies: MarketplaceStrategy[];
  loading: boolean;
  error: Error | null;
  onActivate: (id: string) => void;
  onRetry: () => void;
}

export function StrategyGrid({ strategies, loading, error, onActivate, onRetry }: StrategyGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
        <p className="mt-4 text-sm text-white/30">Loading strategies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24"
      >
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="mt-4 text-sm text-red-400">Failed to load strategies</p>
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </motion.div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-white/30">No strategies yet</p>
        <p className="mt-2 text-xs text-white/20">Be the first to create a strategy!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {strategies.map((s) => (
        <StrategyCard key={s.id} strategy={s} onActivate={onActivate} />
      ))}
    </div>
  );
}

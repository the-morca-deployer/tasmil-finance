"use client";

import { cn } from "@/lib/utils";

import { VAULT_CONFIG } from "../constants";
import { useVault } from "../hooks";
import { ActivityFeed } from "./activity-feed";

interface VaultActivityPageProps {
  className?: string;
}

export function VaultActivityPage({ className }: VaultActivityPageProps) {
  const { activities } = useVault();

  return (
    <div className={cn("mx-auto max-w-4xl space-y-8 p-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-bold text-3xl">Activity History</h1>
        <p className="text-muted-foreground">
          Complete transaction history for your {VAULT_CONFIG.name} position
        </p>
        <div className="h-px w-full bg-border" />
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={activities} />
    </div>
  );
}

"use client";

import { Bot, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

interface AIStatusProps {
  lastRebalanceTime: string;
  apyBoost: number;
  className?: string;
}

export function AIStatus({ lastRebalanceTime, apyBoost, className }: AIStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border border-border bg-card/50 p-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
          <Bot className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <div className="font-medium">AI Status</div>
          <div className="text-muted-foreground text-sm">
            Auto-rebalanced {lastRebalanceTime} ago
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-green-500" />
        <span className="font-medium text-green-500">+{apyBoost}% APY boost</span>
      </div>
    </div>
  );
}

interface AIStatusCompactProps {
  lastRebalanceTime: string;
  apyBoost: number;
  className?: string;
}

export function AIStatusCompact({ lastRebalanceTime, apyBoost, className }: AIStatusCompactProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Bot className="h-4 w-4 text-purple-500" />
      <span className="text-muted-foreground">
        AI Status: Auto-rebalanced {lastRebalanceTime} ago →{" "}
        <span className="text-green-500">+{apyBoost}% APY boost</span>
      </span>
    </div>
  );
}

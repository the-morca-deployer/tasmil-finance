"use client";

import { ArrowDownLeft, ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ActivityItem } from "../types";

interface ActivityFeedProps {
  activities: ActivityItem[];
  compact?: boolean;
  className?: string;
}

export function ActivityFeed({ activities, compact, className }: ActivityFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return `${diffDays}d ago`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTimeShort = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <span className="text-muted-foreground text-sm">Recent Activity:</span>
        <div className="space-y-1">
          {activities.slice(0, 3).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ActivityIcon type={activity.type} size="sm" />
                <span>
                  {activity.type === "yield" && `+$${activity.amount?.toFixed(2)} yield`}
                  {activity.type === "deposit" && `Deposited $${activity.amount?.toLocaleString()}`}
                  {activity.type === "withdraw" && `Withdrew $${activity.amount?.toLocaleString()}`}
                  {activity.type === "rebalance" && "Rebalanced"}
                </span>
              </div>
              <span className="text-muted-foreground">{formatTime(activity.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-semibold text-lg">Activity History</h3>

      <div className="space-y-2">
        {activities.map((activity) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            formatDate={formatDate}
            formatTimeShort={formatTimeShort}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Types Legend:</span>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>Auto (AI/automation)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>You (manual)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span>Rebalance</span>
        </div>
      </div>
    </div>
  );
}

interface ActivityRowProps {
  activity: ActivityItem;
  formatDate: (timestamp: string) => string;
  formatTimeShort: (timestamp: string) => string;
}

function ActivityRow({ activity, formatDate, formatTimeShort }: ActivityRowProps) {
  const getSourceColor = (source: ActivityItem["source"]) => {
    switch (source) {
      case "auto":
        return "bg-blue-500";
      case "user":
        return "bg-green-500";
      case "ai":
        return "bg-purple-500";
      default:
        return "bg-muted";
    }
  };

  const getSourceLabel = (source: ActivityItem["source"]) => {
    switch (source) {
      case "auto":
        return "Auto";
      case "user":
        return "You";
      case "ai":
        return "AI Decision";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-3">
        <ActivityIcon type={activity.type} />
        <div>
          <div className="font-medium">
            {activity.type === "yield" && `+$${activity.amount?.toFixed(2)} yield`}
            {activity.type === "deposit" && `Deposited $${activity.amount?.toLocaleString()}`}
            {activity.type === "withdraw" && `Withdrew $${activity.amount?.toLocaleString()}`}
            {activity.type === "rebalance" && "Rebalance"}
          </div>
          {activity.description && (
            <div className="text-muted-foreground text-sm">{activity.description}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm">
          {formatDate(activity.timestamp)} {formatTimeShort(activity.timestamp)}
        </span>
        <div className="flex items-center gap-1">
          <div className={cn("h-2 w-2 rounded-full", getSourceColor(activity.source))} />
          <span className="text-muted-foreground text-xs">{getSourceLabel(activity.source)}</span>
        </div>
      </div>
    </div>
  );
}

interface ActivityIconProps {
  type: ActivityItem["type"];
  size?: "sm" | "md";
}

function ActivityIcon({ type, size = "md" }: ActivityIconProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const containerSize = size === "sm" ? "h-5 w-5" : "h-8 w-8";

  const getIconConfig = () => {
    switch (type) {
      case "yield":
        return {
          icon: <Sparkles className={iconSize} />,
          bg: "bg-green-500/10",
          color: "text-green-500",
        };
      case "deposit":
        return {
          icon: <ArrowDownLeft className={iconSize} />,
          bg: "bg-blue-500/10",
          color: "text-blue-500",
        };
      case "withdraw":
        return {
          icon: <ArrowUpRight className={iconSize} />,
          bg: "bg-orange-500/10",
          color: "text-orange-500",
        };
      case "rebalance":
        return {
          icon: <RefreshCw className={iconSize} />,
          bg: "bg-purple-500/10",
          color: "text-purple-500",
        };
      default:
        return {
          icon: <Sparkles className={iconSize} />,
          bg: "bg-muted",
          color: "text-muted-foreground",
        };
    }
  };

  const config = getIconConfig();

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full",
        containerSize,
        config.bg,
        config.color
      )}
    >
      {config.icon}
    </div>
  );
}

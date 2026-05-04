"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  type LucideIcon,
  RefreshCw,
  Settings,
  ShieldOff,
  XCircle,
  Zap,
} from "lucide-react";
import Image from "next/image";
import type { ActivityItem } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { getExplorerUrl } from "@/shared/config/stellar";
import { PROTOCOL_ICONS } from "@/shared/constants/asset-manifest";

const ACTION_ICONS: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  DEPLOY: { icon: Layers, bg: "bg-primary/10", fg: "text-primary" },
  FUND: { icon: ArrowDownLeft, bg: "bg-primary/10", fg: "text-primary" },
  DEPOSIT: { icon: ArrowDownLeft, bg: "bg-primary/10", fg: "text-primary" },
  REBALANCE: { icon: RefreshCw, bg: "bg-muted/30", fg: "text-muted-foreground" },
  HARVEST: { icon: Zap, bg: "bg-emerald-500/10", fg: "text-emerald-400" },
  WITHDRAW: { icon: ArrowUpRight, bg: "bg-destructive/10", fg: "text-destructive" },
  HALT: { icon: XCircle, bg: "bg-destructive/10", fg: "text-destructive" },
  RESUME: { icon: CheckCircle2, bg: "bg-primary/10", fg: "text-primary" },
  PRESET_CHANGE: { icon: Settings, bg: "bg-muted/30", fg: "text-muted-foreground" },
  REVOKE: { icon: ShieldOff, bg: "bg-destructive/10", fg: "text-destructive" },
};

const ACTIVITY_LABEL: Record<string, string> = {
  DEPLOY: "Account Created",
  FUND: "Deposit",
  DEPOSIT: "Deposit",
  REBALANCE: "Rebalance",
  HARVEST: "Harvest",
  WITHDRAW: "Withdrawal",
  HALT: "Bot Halted",
  RESUME: "Bot Resumed",
  PRESET_CHANGE: "Strategy Changed",
  REVOKE: "Bot Revoked",
};

export interface ActivityRowProps {
  activity: ActivityItem;
}

export function ActivityRow({ activity }: ActivityRowProps) {
  const isReward = activity.category === "reward";
  const protocolKey = activity.pool?.protocol?.toLowerCase();
  const protocolIcon = protocolKey ? PROTOCOL_ICONS[protocolKey] : undefined;
  const actionConfig = ACTION_ICONS[activity.type] ?? {
    icon: Clock,
    bg: "bg-muted/30",
    fg: "text-muted-foreground",
  };
  const ActionIcon = actionConfig.icon;
  const label = ACTIVITY_LABEL[activity.type] ?? activity.type;
  const subline = activity.pool?.name ?? activity.detail ?? "";

  return (
    <div
      data-testid="activity-row"
      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20"
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          actionConfig.bg
        )}
      >
        {protocolIcon ? (
          <Image src={protocolIcon} alt="" width={20} height={20} className="rounded-full" />
        ) : (
          <ActionIcon className={cn("h-[15px] w-[15px]", actionConfig.fg)} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground text-sm">{label}</p>
        {subline && <p className="truncate text-muted-foreground text-xs">{subline}</p>}
      </div>
      {activity.amount != null && activity.token && (
        <div className="flex shrink-0 flex-col items-end">
          <span
            className={cn(
              "font-semibold text-sm",
              isReward ? "text-emerald-400" : "text-foreground"
            )}
          >
            {isReward ? "+" : ""}
            {activity.amount.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}{" "}
            {activity.token}
          </span>
          {activity.amountUsd != null && (
            <span className="text-muted-foreground text-xs">
              $
              {activity.amountUsd.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </div>
      )}
      {activity.txHash && (
        <a
          href={getExplorerUrl("tx", activity.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary text-sm hover:underline"
        >
          TX
        </a>
      )}
      <span className="shrink-0 text-muted-foreground text-xs">
        {new Date(activity.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

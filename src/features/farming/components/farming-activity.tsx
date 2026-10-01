"use client";

import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock,
  Crosshair,
  Droplets,
  Layers,
  Lightbulb,
  type LucideIcon,
  Pause,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShieldOff,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ActivityItem } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { getExplorerUrl } from "@/shared/config/stellar";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { groupByDate as groupActivitiesByDate } from "@/shared/utils/date-group";

const OP_ICONS: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  DEPLOY: { icon: Layers, bg: "bg-primary/10", fg: "text-primary" },
  FUND: { icon: ArrowDownLeft, bg: "bg-primary/10", fg: "text-primary" },
  DEPOSIT: { icon: ArrowDownLeft, bg: "bg-primary/10", fg: "text-primary" },
  REBALANCE: { icon: RefreshCw, bg: "bg-muted/30", fg: "text-muted-foreground" },
  HARVEST: { icon: Zap, bg: "bg-primary/10", fg: "text-primary" },
  WITHDRAW: { icon: ArrowUpRight, bg: "bg-destructive/10", fg: "text-destructive" },
  HALT: { icon: XCircle, bg: "bg-destructive/10", fg: "text-destructive" },
  RESUME: { icon: CheckCircle2, bg: "bg-primary/10", fg: "text-primary" },
  PRESET_CHANGE: { icon: Settings, bg: "bg-muted/30", fg: "text-muted-foreground" },
  REVOKE: { icon: ShieldOff, bg: "bg-destructive/10", fg: "text-destructive" },
  BACKSTOP_QUEUE: { icon: Pause, bg: "bg-muted/30", fg: "text-muted-foreground" },
  BACKSTOP_EXIT: { icon: CheckCircle2, bg: "bg-primary/10", fg: "text-primary" },
};

// Sub-type icons for REBALANCE based on detail text
const REBALANCE_SUB: {
  match: RegExp;
  icon: LucideIcon;
  bg: string;
  fg: string;
  label: string;
}[] = [
  {
    match: /initial allocation/i,
    icon: Crosshair,
    bg: "bg-primary/10",
    fg: "text-primary",
    label: "Initial Allocation",
  },
  {
    match: /drift/i,
    icon: TrendingUp,
    bg: "bg-muted/30",
    fg: "text-muted-foreground",
    label: "Drift Rebalance",
  },
  {
    match: /swap|liquidity/i,
    icon: ArrowLeftRight,
    bg: "bg-muted/30",
    fg: "text-muted-foreground",
    label: "Swap Rebalance",
  },
  {
    match: /withdraw|exit/i,
    icon: ArrowUpRight,
    bg: "bg-destructive/10",
    fg: "text-destructive",
    label: "Exit Rebalance",
  },
  {
    match: /deposit|supply/i,
    icon: Droplets,
    bg: "bg-primary/10",
    fg: "text-primary",
    label: "Supply Rebalance",
  },
];

type ActivityCategory = "all" | "protocol" | "reward" | "policy";

/**
 * One agent policy decision (Net-Edge / price guard / Policy Guard), already
 * mapped by the transparency feature. Declared structurally here so this
 * component does not depend on another feature's module.
 */
export interface PolicyTimelineRow {
  id: string;
  createdAt: string;
  outcome: "declined" | "refused" | "rejected" | "executed" | "proposed" | "no_action" | "pending";
  title: string;
  reason: string | null;
  txUrl: string | null;
  replayHref: string | null;
}

type TimelineEntry =
  | { source: "account"; id: string; createdAt: string; activity: ActivityItem }
  | { source: "policy"; id: string; createdAt: string; row: PolicyTimelineRow };

const POLICY_ICONS: Record<
  PolicyTimelineRow["outcome"],
  { icon: LucideIcon; bg: string; fg: string }
> = {
  declined: { icon: Ban, bg: "bg-amber-500/10", fg: "text-amber-400" },
  refused: { icon: ShieldAlert, bg: "bg-amber-500/10", fg: "text-amber-400" },
  rejected: { icon: XCircle, bg: "bg-destructive/10", fg: "text-destructive" },
  executed: { icon: CheckCircle2, bg: "bg-primary/10", fg: "text-primary" },
  proposed: { icon: Lightbulb, bg: "bg-muted/30", fg: "text-muted-foreground" },
  no_action: { icon: Clock, bg: "bg-muted/30", fg: "text-muted-foreground" },
  pending: { icon: Clock, bg: "bg-muted/30", fg: "text-muted-foreground" },
};

const EMPTY_TEXT: Record<ActivityCategory, string> = {
  all: "No activity yet",
  protocol: "No protocol activity yet",
  reward: "No rewards yet",
  policy: "No agent decisions yet",
};

const PROTOCOL_TYPES: ReadonlySet<string> = new Set([
  "DEPLOY",
  "FUND",
  "DEPOSIT",
  "WITHDRAW",
  "REBALANCE",
  "PRESET_CHANGE",
  "HALT",
  "RESUME",
  "REVOKE",
]);

const REWARD_TYPES: ReadonlySet<string> = new Set(["HARVEST", "BACKSTOP_QUEUE", "BACKSTOP_EXIT"]);

function categoryFilter(category: ActivityCategory) {
  return (a: ActivityItem) => {
    if (category === "all") return true;
    if (category === "protocol") return PROTOCOL_TYPES.has(a.type);
    if (category === "reward") return REWARD_TYPES.has(a.type);
    return false;
  };
}

function isReward(type: string): boolean {
  return REWARD_TYPES.has(type);
}

function getActivityIcon(activity: ActivityItem): { icon: LucideIcon; bg: string; fg: string } {
  if (activity.type === "REBALANCE" && activity.detail) {
    for (const sub of REBALANCE_SUB) {
      if (sub.match.test(activity.detail)) {
        return { icon: sub.icon, bg: sub.bg, fg: sub.fg };
      }
    }
  }
  return OP_ICONS[activity.type] ?? { icon: Clock, bg: "bg-muted/30", fg: "text-muted-foreground" };
}

function getActivityLabel(activity: ActivityItem): string {
  if (activity.type === "REBALANCE" && activity.detail) {
    for (const sub of REBALANCE_SUB) {
      if (sub.match.test(activity.detail)) return sub.label;
    }
  }
  return ACTIVITY_LABEL[activity.type] ?? activity.type;
}

export const ACTIVITY_LABEL: Record<string, string> = {
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
  BACKSTOP_QUEUE: "Backstop Queued",
  BACKSTOP_EXIT: "Backstop Exit",
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// --- Sidebar variant (compact, like HistorySidebar) -------------------------

interface FarmingActivitySidebarProps {
  activities: ActivityItem[] | undefined;
  isLoading: boolean;
  onSeeAll?: () => void;
}

export function FarmingActivitySidebar({
  activities,
  isLoading,
  onSeeAll,
}: FarmingActivitySidebarProps) {
  const items = (activities ?? []).slice(0, 6);

  return (
    // On desktop the card is taken out of flow (absolute inset-0) so the grid row
    // height comes from the Allocation chart beside it; the list scrolls inside.
    <div className="relative">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card lg:absolute lg:inset-0">
        <div className="px-6 pt-6 pb-4">
          <h3 className="font-semibold text-foreground text-xl">Activity</h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3.5">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
            <Clock className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="mb-1 font-medium text-muted-foreground text-sm">No activity yet</p>
            <p className="text-center text-muted-foreground/60 text-xs">
              Events will appear here as the agent operates.
            </p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
            {items.map((activity) => {
              const iconConfig = getActivityIcon(activity);
              const Icon = iconConfig.icon;
              const label = getActivityLabel(activity);

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/20"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      iconConfig.bg
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", iconConfig.fg)} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-foreground text-sm">{label}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                  {activity.amount != null && activity.token && (
                    <span className="shrink-0 font-semibold text-foreground text-sm">
                      {activity.amount} {activity.token}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {onSeeAll && (
          <div className="mt-auto border-border border-t px-4 py-3">
            <Button
              variant="ghost"
              className="w-full font-medium text-muted-foreground text-sm hover:text-foreground"
              onClick={onSeeAll}
            >
              See all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Full-page variant (for Activity tab) -----------------------------------

interface FarmingActivityProps {
  activities: ActivityItem[] | undefined;
  isLoading: boolean;
  /** Agent decisions from the policy ledger; merged into "All" and shown alone under "Policy". */
  policyItems?: PolicyTimelineRow[];
}

function PolicyRowView({ row }: { row: PolicyTimelineRow }) {
  const iconConfig = POLICY_ICONS[row.outcome];
  const Icon = iconConfig.icon;
  return (
    <>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          iconConfig.bg
        )}
      >
        <Icon className={cn("h-[15px] w-[15px]", iconConfig.fg)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground text-sm">{row.title}</p>
        {row.reason && (
          <p className="truncate text-muted-foreground text-sm" title={row.reason}>
            {row.reason}
          </p>
        )}
      </div>
      {row.replayHref && (
        <Link href={row.replayHref} className="shrink-0 text-primary text-sm hover:underline">
          Replay
        </Link>
      )}
      {row.txUrl && (
        <a
          href={row.txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary text-sm hover:underline"
        >
          TX
        </a>
      )}
    </>
  );
}

function AccountRowView({ activity }: { activity: ActivityItem }) {
  const iconConfig = getActivityIcon(activity);
  const Icon = iconConfig.icon;
  const label = getActivityLabel(activity);
  const reward = isReward(activity.type);
  return (
    <>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          iconConfig.bg
        )}
      >
        <Icon className={cn("h-[15px] w-[15px]", iconConfig.fg)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground text-sm">{label}</p>
        {activity.detail && (
          <p className="truncate text-muted-foreground text-sm">{activity.detail}</p>
        )}
      </div>
      {activity.amount != null && activity.token && (
        <span
          className={cn(
            "shrink-0 font-semibold text-sm",
            reward ? "text-emerald-400" : "text-foreground"
          )}
        >
          {reward ? "+" : ""}
          {activity.amount} {activity.token}
        </span>
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
    </>
  );
}

export function FarmingActivity({ activities, isLoading, policyItems }: FarmingActivityProps) {
  const [category, setCategory] = useState<ActivityCategory>("all");

  const entries = useMemo<TimelineEntry[]>(() => {
    const account: TimelineEntry[] =
      category === "policy"
        ? []
        : (activities ?? []).filter(categoryFilter(category)).map((activity) => ({
            source: "account",
            id: `a:${activity.id}`,
            createdAt: activity.createdAt,
            activity,
          }));
    const policy: TimelineEntry[] =
      category === "all" || category === "policy"
        ? (policyItems ?? []).map((row) => ({
            source: "policy",
            id: `p:${row.id}`,
            createdAt: row.createdAt,
            row,
          }))
        : [];
    return [...account, ...policy].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [activities, policyItems, category]);

  if (isLoading) {
    return (
      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="font-semibold text-foreground text-xl">Activity Timeline</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3.5">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  const groups = groupActivitiesByDate(entries);

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-semibold text-foreground text-xl">Activity Timeline</h2>
          <p className="text-muted-foreground text-sm">
            Account actions and every agent decision, including declines and Policy Guard
            rejections.
          </p>
        </div>
        <Tabs value={category} onValueChange={(v) => setCategory(v as ActivityCategory)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="protocol">Protocol</TabsTrigger>
            <TabsTrigger value="reward">Reward</TabsTrigger>
            <TabsTrigger value="policy">Policy</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-muted-foreground">
          <Clock className="h-8 w-8 opacity-40" />
          <p className="text-sm">{EMPTY_TEXT[category]}</p>
          {category === "policy" && (
            <p className="max-w-sm text-center text-xs">
              Each time the agent weighs a move, the outcome is recorded here: executed, declined by
              Net-Edge, refused by the price guard, or rejected on-chain by Policy Guard.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <section key={group.key} className="flex flex-col gap-2">
              <h3 className="px-1 pt-2 font-semibold text-muted-foreground text-sm">
                {group.label}
              </h3>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-col divide-y divide-border">
                  {group.items.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, delay: idx * 0.02 }}
                    >
                      {entry.source === "policy" ? (
                        <PolicyRowView row={entry.row} />
                      ) : (
                        <AccountRowView activity={entry.activity} />
                      )}
                      <span className="shrink-0 text-muted-foreground text-sm">
                        {formatRelativeTime(entry.createdAt)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
}

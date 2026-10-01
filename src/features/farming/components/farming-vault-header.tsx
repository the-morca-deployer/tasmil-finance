"use client";

import { motion } from "framer-motion";
import { ArrowDownToLine, ArrowUpFromLine, ShieldCheck, ShieldOff, Tractor } from "lucide-react";
import type { AccountStatus } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

const STATUS_LABEL: Record<AccountStatus, string> = {
  DEPLOYING: "Deploying",
  AWAITING_FUND: "Ready to fund",
  ACTIVE: "Active",
  HALTED: "Halted",
  REVOKED: "Paused",
};

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

interface FarmingVaultHeaderProps {
  totalValueUsd: number;
  allTimePnlUsd: number;
  allTimePnlPercent: number;
  currentApy: number;
  status: AccountStatus;
  onDeposit: () => void;
  onWithdraw: () => void;
  onSecurity: () => void;
}

export function FarmingVaultHeader({
  totalValueUsd,
  allTimePnlUsd,
  allTimePnlPercent,
  currentApy,
  status,
  onDeposit,
  onWithdraw,
  onSecurity,
}: FarmingVaultHeaderProps) {
  const isRevoked = status === "REVOKED";
  const pnlPositive = allTimePnlUsd >= 0;

  return (
    <motion.section
      data-onborda="farming-header"
      className="overflow-hidden rounded-2xl border border-border/50 p-4 sm:p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-full sm:size-20",
              status === "ACTIVE" ? "bg-primary/15" : "bg-muted/30"
            )}
          >
            <Tractor
              className={cn(
                "size-7 sm:size-9",
                status === "ACTIVE" ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">USD portfolio value</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium text-xs",
                  status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : status === "HALTED"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {STATUS_LABEL[status]}
              </span>
            </div>
            <p className="font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
              {formatUsd(totalValueUsd)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-medium text-primary">{(currentApy * 100).toFixed(2)}% APY</span>
              <span
                className={cn("font-medium", pnlPositive ? "text-emerald-400" : "text-destructive")}
              >
                {pnlPositive ? "+" : ""}
                {formatUsd(allTimePnlUsd)} ({pnlPositive ? "+" : ""}
                {allTimePnlPercent.toFixed(2)}%) all time
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
          <Button variant="gradient" onClick={onDeposit} className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Deposit
          </Button>
          <Button variant="outline" onClick={onWithdraw} className="gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Withdraw
          </Button>
          <Button
            variant={isRevoked ? "gradient" : "ghost"}
            onClick={onSecurity}
            className={cn("col-span-2 gap-2", !isRevoked && "text-muted-foreground")}
          >
            {isRevoked ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            {isRevoked ? "Activate Session Key" : "Revoke"}
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

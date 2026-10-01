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
      className="overflow-hidden px-1 py-3 sm:px-2 sm:py-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-full sm:size-16",
              status === "ACTIVE" ? "bg-primary/15" : "bg-muted/30"
            )}
          >
            <Tractor
              className={cn(
                "size-6 sm:size-7",
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

        <div
          data-testid="vault-header-actions"
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:flex-nowrap lg:justify-self-end"
        >
          <Button variant="gradient" onClick={onDeposit} className="h-11 gap-2 px-5">
            <ArrowDownToLine className="h-4 w-4" />
            Deposit
          </Button>
          <Button variant="outline" onClick={onWithdraw} className="h-11 gap-2 px-5">
            <ArrowUpFromLine className="h-4 w-4" />
            Withdraw
          </Button>
          <Button
            variant={isRevoked ? "gradient" : "ghost"}
            onClick={onSecurity}
            className={cn(
              "col-span-2 h-11 gap-2 px-5 sm:col-span-1",
              !isRevoked && "text-muted-foreground"
            )}
          >
            {isRevoked ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            {isRevoked ? "Activate Session Key" : "Revoke"}
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

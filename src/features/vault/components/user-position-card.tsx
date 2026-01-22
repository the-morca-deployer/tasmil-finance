"use client";

import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { VAULT_CONFIG } from "../constants";
import type { UserVaultPosition, VaultStats } from "../types";

interface UserPositionCardProps {
  position: UserVaultPosition;
  vaultStats: VaultStats;
  onDeposit: () => void;
  onWithdraw: () => void;
  className?: string;
}

export function UserPositionCard({
  position,
  vaultStats,
  onDeposit,
  onWithdraw,
  className,
}: UserPositionCardProps) {
  const isPositive = position.weeklyChange >= 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your {VAULT_CONFIG.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Balance */}
        <div className="flex items-end justify-between">
          <div>
            <div className="font-bold text-4xl">${position.balance.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingUp className="h-4 w-4 rotate-180 text-red-500" />
              )}
              <span className={cn("font-medium", isPositive ? "text-green-500" : "text-red-500")}>
                {isPositive ? "+" : ""}
                {position.weeklyChange}% this week
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-muted-foreground text-sm">APY</div>
            <div className="font-bold text-xl text-green-500">{vaultStats.apy}%</div>
          </div>
        </div>

        {/* APY Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF]"
            style={{ width: `${Math.min(vaultStats.apy * 5, 100)}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12" onClick={onWithdraw}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            WITHDRAW
          </Button>
          <Button variant="gradient" className="h-12" onClick={onDeposit}>
            <ArrowDownLeft className="mr-2 h-4 w-4" />
            DEPOSIT
          </Button>
        </div>

        {/* Position Details */}
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <DetailRow label="Balance" value={`$${position.balance.toLocaleString()}`} />
          <DetailRow
            label="Shares"
            value={`${position.shares.toLocaleString()} ${VAULT_CONFIG.shareToken}`}
          />
          <DetailRow
            label="Unrealized Yield"
            value={`+$${position.unrealizedYield.toFixed(2)}`}
            highlight
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function DetailRow({ label, value, highlight }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", highlight && "text-green-500")}>{value}</span>
    </div>
  );
}

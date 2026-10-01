"use client";

import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  ShieldCheck,
  ShieldOff,
  Tractor,
} from "lucide-react";
import type { AccountStatus } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { WalletAvatar } from "@/shared/components/wallet-avatar";
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
  totalValueAsset: number;
  displayAsset: string;
  assetPriceUsd: number;
  allTimePnlUsd: number;
  allTimePnlAsset: number;
  allTimePnlPercent: number;
  allTimePnlPercentAsset: number;
  currentApy: number;
  status: AccountStatus;
  /** Keeper-wallet (vault) contract address; shows its avatar + explorer link. */
  vaultAddress?: string;
  onDeposit: () => void;
  onWithdraw: () => void;
  onSecurity: () => void;
}

export function FarmingVaultHeader({
  totalValueUsd,
  totalValueAsset,
  displayAsset,
  assetPriceUsd,
  allTimePnlUsd,
  allTimePnlAsset,
  allTimePnlPercent,
  allTimePnlPercentAsset,
  currentApy,
  status,
  vaultAddress,
  onDeposit,
  onWithdraw,
  onSecurity,
}: FarmingVaultHeaderProps) {
  const isRevoked = status === "REVOKED";
  const pnlPositive = allTimePnlAsset >= 0;
  const assetPnlSign = pnlPositive ? "+" : "";
  const formatAsset = (value: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 7,
    }).format(value);
  const usdPnlSign = allTimePnlUsd >= 0 ? "+" : "";

  return (
    <motion.section
      data-onborda="farming-header"
      className="overflow-hidden px-1 py-2 sm:px-2 sm:py-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {vaultAddress ? (
            <WalletAvatar address={vaultAddress} size={56} className="size-12 sm:size-14" />
          ) : (
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14",
                status === "ACTIVE" ? "bg-primary/15" : "bg-muted/30"
              )}
            >
              <Tractor
                className={cn(
                  "size-5 sm:size-6",
                  status === "ACTIVE" ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">{displayAsset} portfolio value</span>
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
              {vaultAddress && (
                <a
                  href={`https://stellar.expert/explorer/public/contract/${vaultAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-muted-foreground text-xs hover:text-foreground"
                  title={vaultAddress}
                >
                  Vault {vaultAddress.slice(0, 4)}...{vaultAddress.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <p className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
              {formatAsset(totalValueAsset)} {displayAsset}
            </p>
            <p className="mt-0.5 text-muted-foreground text-sm">
              <span>≈ {formatUsd(totalValueUsd)}</span> at {formatUsd(assetPriceUsd)}/{displayAsset}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-medium text-primary">{(currentApy * 100).toFixed(2)}% APY</span>
              <span
                className={cn("font-medium", pnlPositive ? "text-emerald-400" : "text-destructive")}
              >
                {assetPnlSign}
                {formatAsset(allTimePnlAsset)} {displayAsset} ({assetPnlSign}
                {allTimePnlPercentAsset.toFixed(2)}%) all time
              </span>
              <span className="text-muted-foreground text-xs">
                ≈ {usdPnlSign}
                {formatUsd(allTimePnlUsd)} ({usdPnlSign}
                {allTimePnlPercent.toFixed(2)}% USD)
              </span>
            </div>
          </div>
        </div>

        <div
          data-testid="vault-header-actions"
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:flex-nowrap lg:justify-self-end"
        >
          <Button variant="gradient" onClick={onDeposit} className="h-10 gap-2 rounded-full px-4">
            <ArrowDownToLine className="h-4 w-4" />
            Deposit
          </Button>
          <Button variant="outline" onClick={onWithdraw} className="h-10 gap-2 rounded-full px-4">
            <ArrowUpFromLine className="h-4 w-4" />
            Withdraw
          </Button>
          <Button
            variant={isRevoked ? "gradient" : "destructive"}
            onClick={onSecurity}
            className="col-span-2 h-10 gap-2 rounded-full px-4 sm:col-span-1"
          >
            {isRevoked ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            {isRevoked ? "Activate Session Key" : "Revoke Session Key"}
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

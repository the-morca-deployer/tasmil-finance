"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { VAULT_CONFIG } from "../constants";
import { useDeposit, useVault } from "../hooks";
import { AIStatusCompact } from "./ai-status";
import { AllocationDisplay } from "./allocation-display";
import { DepositInput } from "./deposit-input";
import { DepositModal } from "./deposit-modal";
import { VaultDailyChange, VaultStatsCard } from "./vault-stats-card";

interface VaultLandingPageProps {
  className?: string;
}

export function VaultLandingPage({ className }: VaultLandingPageProps) {
  const { vaultStats, allocations, lastRebalance } = useVault();
  const { modalState, setAmount, deposit, reset } = useDeposit();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [inputAmount, setInputAmount] = useState(0);

  const handleDeposit = () => {
    if (inputAmount > 0) {
      setAmount(inputAmount);
      setDepositModalOpen(true);
    }
  };

  const handleConfirmDeposit = async () => {
    await deposit();
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      reset();
    }
    setDepositModalOpen(open);
  };

  return (
    <div className={cn("mx-auto max-w-4xl space-y-8 p-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-bold text-3xl">{VAULT_CONFIG.name}</h1>
        <div className="h-px w-full bg-border" />
      </div>

      {/* Stats */}
      <VaultStatsCard stats={vaultStats} />

      {/* Deposit Card */}
      <DepositInput
        value={inputAmount}
        onChange={setInputAmount}
        maxBalance={10000}
        onDeposit={handleDeposit}
      />

      {/* AI Allocation */}
      <AllocationDisplay allocations={allocations} compact />

      {/* Daily Change & AI Status */}
      <div className="space-y-3">
        <VaultDailyChange
          dailyChange={vaultStats.dailyChange}
          tvlChange24h={vaultStats.tvlChange24h}
        />
        <AIStatusCompact
          lastRebalanceTime={lastRebalance.timeAgo}
          apyBoost={lastRebalance.apyBoost}
        />
      </div>

      {/* Deposit Modal */}
      <DepositModal
        open={depositModalOpen}
        onOpenChange={handleModalClose}
        state={modalState}
        onConfirm={handleConfirmDeposit}
      />
    </div>
  );
}

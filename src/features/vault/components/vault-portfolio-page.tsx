"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { VAULT_CONFIG } from "../constants";
import { useDeposit, useVault, useWithdraw } from "../hooks";
import { AIStatus } from "./ai-status";
import { ActivityFeed } from "./activity-feed";
import { DepositModal } from "./deposit-modal";
import { UserPositionCard } from "./user-position-card";
import { WithdrawModal } from "./withdraw-modal";

interface VaultPortfolioPageProps {
  className?: string;
}

export function VaultPortfolioPage({ className }: VaultPortfolioPageProps) {
  const { vaultStats, userPosition, activities, lastRebalance } = useVault();
  const {
    modalState: depositState,
    setAmount: setDepositAmount,
    deposit,
    reset: resetDeposit,
  } = useDeposit();
  const {
    modalState: withdrawState,
    setAmount: setWithdrawAmount,
    setEmergency,
    withdraw,
    reset: resetWithdraw,
  } = useWithdraw();

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawInputAmount, setWithdrawInputAmount] = useState("");

  // Handle no position state
  if (!userPosition) {
    return (
      <div className={cn("mx-auto max-w-4xl space-y-8 p-6", className)}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="mb-2 font-bold text-2xl">No Position Yet</h2>
          <p className="mb-6 text-muted-foreground">
            Deposit to {VAULT_CONFIG.name} to start earning yield
          </p>
          <a
            href="/vault"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] px-8 font-bold text-black transition-all hover:scale-105"
          >
            Go to Vault
          </a>
        </div>
      </div>
    );
  }

  const handleDeposit = () => {
    setDepositAmount(1000); // Default amount
    setDepositModalOpen(true);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawInputAmount) || userPosition.balance;
    setWithdrawAmount(amount, userPosition.balance);
    setWithdrawModalOpen(true);
  };

  const handleDepositModalClose = (open: boolean) => {
    if (!open) resetDeposit();
    setDepositModalOpen(open);
  };

  const handleWithdrawModalClose = (open: boolean) => {
    if (!open) {
      resetWithdraw();
      setWithdrawInputAmount("");
    }
    setWithdrawModalOpen(open);
  };

  const handleEmergencyToggle = (isEmergency: boolean) => {
    setEmergency(isEmergency, withdrawState.amount);
  };

  return (
    <div className={cn("mx-auto max-w-4xl space-y-8 p-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-bold text-3xl">Your {VAULT_CONFIG.name}</h1>
        <div className="h-px w-full bg-border" />
      </div>

      {/* User Position Card */}
      <UserPositionCard
        position={userPosition}
        vaultStats={vaultStats}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
      />

      {/* AI Status */}
      <AIStatus lastRebalanceTime={lastRebalance.timeAgo} apyBoost={lastRebalance.apyBoost} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed activities={activities} compact />
        </CardContent>
      </Card>

      {/* Modals */}
      <DepositModal
        open={depositModalOpen}
        onOpenChange={handleDepositModalClose}
        state={depositState}
        onConfirm={deposit}
      />

      <WithdrawModal
        open={withdrawModalOpen}
        onOpenChange={handleWithdrawModalClose}
        state={withdrawState}
        onConfirm={withdraw}
        onEmergencyToggle={handleEmergencyToggle}
      />
    </div>
  );
}

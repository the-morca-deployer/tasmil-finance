"use client";

import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";

import { useDeposit, useVault, useWithdraw } from "../hooks";
import { DepositModal } from "./deposit-modal";
import { WithdrawModal } from "./withdraw-modal";

interface MobileVaultDashboardProps {
  className?: string;
}

export function MobileVaultDashboard({ className }: MobileVaultDashboardProps) {
  const { vaultStats, userPosition, activities } = useVault();
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

  const handleDeposit = () => {
    setDepositAmount(1000);
    setDepositModalOpen(true);
  };

  const handleWithdraw = () => {
    if (userPosition) {
      setWithdrawAmount(userPosition.balance, userPosition.balance);
      setWithdrawModalOpen(true);
    }
  };

  const handleDepositModalClose = (open: boolean) => {
    if (!open) resetDeposit();
    setDepositModalOpen(open);
  };

  const handleWithdrawModalClose = (open: boolean) => {
    if (!open) resetWithdraw();
    setWithdrawModalOpen(open);
  };

  const handleEmergencyToggle = (isEmergency: boolean) => {
    setEmergency(isEmergency, withdrawState.amount);
  };

  const isPositive = userPosition ? userPosition.weeklyChange >= 0 : true;

  return (
    <div className={cn("flex min-h-screen flex-col p-4", className)}>
      {/* Balance Display */}
      <div className="mb-6 text-center">
        <div className="font-bold text-4xl">
          ${userPosition?.balance.toLocaleString() ?? "0.00"}
        </div>
        <div className="mt-2 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 rotate-180 text-red-500" />
            )}
            <span className={cn("font-medium", isPositive ? "text-green-500" : "text-red-500")}>
              {isPositive ? "+" : ""}
              {userPosition?.weeklyChange ?? 0}%
            </span>
          </div>
          <span className="text-green-500 font-medium">{vaultStats.apy}%</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 space-y-3">
        <Button variant="gradient" className="h-14 w-full text-lg" onClick={handleDeposit}>
          <ArrowDownLeft className="mr-2 h-5 w-5" />
          DEPOSIT
        </Button>
        <Button variant="outline" className="h-14 w-full text-lg" onClick={handleWithdraw}>
          <ArrowUpRight className="mr-2 h-5 w-5" />
          WITHDRAW
        </Button>
      </div>

      {/* Activity */}
      <div className="flex-1">
        <h3 className="mb-3 font-semibold">Activity</h3>
        <div className="space-y-2">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between text-sm">
              <span>
                {activity.type === "yield" && `+$${activity.amount?.toFixed(2)}`}
                {activity.type === "deposit" && `Deposited $${activity.amount?.toLocaleString()}`}
                {activity.type === "withdraw" && `Withdrew $${activity.amount?.toLocaleString()}`}
                {activity.type === "rebalance" && "Rebalanced"}
              </span>
              <span className="text-muted-foreground">
                {new Date(activity.timestamp).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

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

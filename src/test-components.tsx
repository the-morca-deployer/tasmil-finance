"use client";

import { DepositDialog } from "@/components/deposit-dialog";
import { WithdrawDialog } from "@/components/withdraw-dialog";
import { OnboardingDialog } from "@/features/onboarding";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useWallet } from "@/shared/context/wallet-context";
import { useState } from "react";
import { Button } from "@/shared/ui/button";

export function TestComponents() {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const { isOnboardingOpen, openOnboarding } = useOnboarding();
  const { address, isConnected } = useWallet();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Component Tests</h1>

      {/* Test Buttons */}
      <div className="flex gap-4">
        <Button onClick={openOnboarding}>Test Onboarding</Button>
        <Button onClick={() => setShowDeposit(true)}>Test Deposit</Button>
        <Button onClick={() => setShowWithdraw(true)}>Test Withdraw</Button>
      </div>

      {/* Wallet Status */}
      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Wallet Status:</h2>
        <p>Connected: {isConnected ? "Yes" : "No"}</p>
        <p>Address: {address || "Not connected"}</p>
      </div>

      {/* Dialogs */}
      <OnboardingDialog open={isOnboardingOpen} onOpenChange={() => {}} />
      <DepositDialog open={showDeposit} onOpenChange={setShowDeposit} />
      <WithdrawDialog open={showWithdraw} onOpenChange={setShowWithdraw} />
    </div>
  );
}

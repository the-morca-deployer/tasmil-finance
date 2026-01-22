"use client";

// Test component để đảm bảo tất cả components hoạt động
import { SimpleSmartWallet } from "@/components/simple-smart-wallet";
import { DepositDialog } from "@/components/deposit-dialog";
import { WithdrawDialog } from "@/components/withdraw-dialog";
import { OnboardingDialog } from "@/features/onboarding";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useSimpleSmartWallet } from "@/hooks/use-simple-smart-wallet";
import { useState } from "react";
import { Button } from "@/shared/ui/button";

export function TestComponents() {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const { isOnboardingOpen, openOnboarding } = useOnboarding();
  const { smartAccount } = useSimpleSmartWallet();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Component Tests</h1>
      
      {/* Test Buttons */}
      <div className="flex gap-4">
        <Button onClick={openOnboarding}>Test Onboarding</Button>
        <Button onClick={() => setShowDeposit(true)}>Test Deposit</Button>
        <Button onClick={() => setShowWithdraw(true)}>Test Withdraw</Button>
      </div>

      {/* Smart Wallet Status */}
      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Smart Wallet Status:</h2>
        <p>Address: {smartAccount?.address || "Not created"}</p>
        <p>Deployed: {smartAccount?.isDeployed ? "Yes" : "No"}</p>
      </div>

      {/* Simple Smart Wallet Component */}
      <SimpleSmartWallet />

      {/* Dialogs */}
      <OnboardingDialog open={isOnboardingOpen} onOpenChange={() => {}} />
      <DepositDialog open={showDeposit} onOpenChange={setShowDeposit} />
      <WithdrawDialog open={showWithdraw} onOpenChange={setShowWithdraw} />
    </div>
  );
}
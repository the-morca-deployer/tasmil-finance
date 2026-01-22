"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Wallet, Play, RotateCcw } from "lucide-react";
import { SmartWalletOnboarding } from "./smart-wallet-onboarding";
import { SmartWalletInfo } from "./smart-wallet-info";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useSimpleSmartWallet } from "@/hooks/use-simple-smart-wallet";

export function SmartWalletDemo() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { hasCompletedOnboarding, resetOnboarding } = useOnboarding();
  const { smartAccount } = useSimpleSmartWallet();

  const handleStartDemo = () => {
    setShowOnboarding(true);
  };

  const handleResetDemo = () => {
    resetOnboarding();
    setShowOnboarding(false);
  };

  const handleOnboardingComplete = (address: string) => {
    setShowOnboarding(false);
    console.log("Smart wallet created:", address);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Smart Wallet Demo
          </CardTitle>
          <CardDescription>
            Test the smart wallet onboarding flow and features
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={smartAccount?.address ? "default" : "secondary"}>
              {smartAccount?.address ? "Smart Wallet Created" : "No Smart Wallet"}
            </Badge>
            <Badge variant={hasCompletedOnboarding ? "default" : "outline"}>
              {hasCompletedOnboarding ? "Onboarding Complete" : "Onboarding Pending"}
            </Badge>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button onClick={handleStartDemo} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Onboarding Demo
            </Button>
            <Button onClick={handleResetDemo} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset Demo
            </Button>
          </div>

          {/* Current State Info */}
          {smartAccount?.address && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Smart Wallet Address:</div>
              <div className="text-xs font-mono text-muted-foreground break-all">
                {smartAccount.address}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full">
            <SmartWalletOnboarding
              onComplete={handleOnboardingComplete}
              onSkip={handleOnboardingSkip}
            />
          </div>
        </div>
      )}

      {/* Smart Wallet Info Display */}
      {smartAccount?.address && (
        <SmartWalletInfo />
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>1. Connect your wallet first</div>
          <div>2. Click "Start Onboarding Demo" to begin the flow</div>
          <div>3. Follow the 2-step process: Smart Wallet Setup → Deposit Funds</div>
          <div>4. View your smart wallet info after completion</div>
          <div>5. Use "Reset Demo" to test again</div>
        </CardContent>
      </Card>
    </div>
  );
}
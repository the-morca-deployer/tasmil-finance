"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Wallet, CheckCircle } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";

interface SmartWalletOnboardingProps {
  onComplete?: (address: string) => void;
  onSkip?: () => void;
}

/**
 * Smart wallet onboarding — simplified after EVM removal.
 * On Stellar, there's no separate "smart wallet" creation step.
 * Users connect their Stellar wallet and are ready to go.
 */
export function SmartWalletOnboarding({ onComplete, onSkip }: SmartWalletOnboardingProps) {
  const { isConnected, address, connect } = useWallet();

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-6 w-6" />
            Wallet Setup
          </CardTitle>
          <CardDescription>
            Connect your Stellar wallet to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={connect} className="w-full">
            Connect Wallet
          </Button>
          {onSkip && (
            <Button variant="outline" onClick={onSkip} className="w-full">
              Skip
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          Wallet Connected
        </CardTitle>
        <CardDescription>Your wallet is ready to use</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium mb-1">Connected Address</div>
          <div className="text-xs text-muted-foreground font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>
        <Button onClick={() => onComplete?.(address!)} className="w-full">
          Continue to Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}

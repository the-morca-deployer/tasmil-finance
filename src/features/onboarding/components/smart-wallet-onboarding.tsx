"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Loader2, Wallet, CheckCircle, ArrowRight, Copy } from "lucide-react";
import { useSmartWallet } from "@/hooks/use-smart-wallet";
import { toast } from "sonner";

interface SmartWalletOnboardingProps {
  onComplete?: (smartWalletAddress: string) => void;
  onSkip?: () => void;
}

export function SmartWalletOnboarding({ onComplete, onSkip }: SmartWalletOnboardingProps) {
  const { address, isConnected } = useAccount();
  const { isCreating, smartWalletAddress, createSmartWallet, sendInitialTransaction, error } = useSmartWallet();
  const [step, setStep] = useState<"create" | "initialize" | "complete">("create");

  const handleCreateWallet = async () => {
    const result = await createSmartWallet();
    if (result) {
      setStep("initialize");
    }
  };

  const handleInitialize = async () => {
    const result = await sendInitialTransaction();
    if (result) {
      setStep("complete");
      onComplete?.(smartWalletAddress!);
    }
  };

  const handleCopyAddress = () => {
    if (smartWalletAddress) {
      navigator.clipboard.writeText(smartWalletAddress);
      toast.success("Smart wallet address copied!");
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-6 w-6" />
            Smart Wallet Setup
          </CardTitle>
          <CardDescription>
            Please connect your wallet first to create a smart wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            Connect your wallet using the button in the top right corner
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Wallet className="h-6 w-6" />
          Smart Wallet Setup
        </CardTitle>
        <CardDescription>
          Create your smart wallet for enhanced security and features
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "create" ? "bg-primary text-primary-foreground" : 
              step === "initialize" || step === "complete" ? "bg-green-500 text-white" : "bg-muted"
            }`}>
              {step === "initialize" || step === "complete" ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            <span className="text-sm font-medium">Create</span>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "initialize" ? "bg-primary text-primary-foreground" : 
              step === "complete" ? "bg-green-500 text-white" : "bg-muted"
            }`}>
              {step === "complete" ? <CheckCircle className="h-4 w-4" /> : "2"}
            </div>
            <span className="text-sm font-medium">Initialize</span>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "complete" ? "bg-green-500 text-white" : "bg-muted"
            }`}>
              {step === "complete" ? <CheckCircle className="h-4 w-4" /> : "3"}
            </div>
            <span className="text-sm font-medium">Complete</span>
          </div>
        </div>

        {/* Connected Wallet Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium mb-1">Connected Wallet</div>
          <div className="text-xs text-muted-foreground font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>

        {/* Smart Wallet Address */}
        {smartWalletAddress && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-green-800">Smart Wallet Address</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs text-green-700 font-mono break-all">
              {smartWalletAddress}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Step Content */}
        {step === "create" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Create a smart wallet that provides enhanced security features and gasless transactions.
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Enhanced security with multi-signature support</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Gasless transactions for better UX</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Account recovery options</span>
              </div>
            </div>
          </div>
        )}

        {step === "initialize" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Initialize your smart wallet by sending the first transaction to activate all features.
            </div>
            <Badge variant="secondary" className="w-fit">
              Smart wallet created successfully!
            </Badge>
          </div>
        )}

        {step === "complete" && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-semibold text-green-800">Setup Complete!</div>
              <div className="text-sm text-muted-foreground">
                Your smart wallet is ready to use
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {step === "create" && (
            <>
              <Button
                onClick={handleCreateWallet}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Smart Wallet"
                )}
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            </>
          )}

          {step === "initialize" && (
            <Button
              onClick={handleInitialize}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize Wallet"
              )}
            </Button>
          )}

          {step === "complete" && (
            <Button onClick={() => onComplete?.(smartWalletAddress!)} className="flex-1">
              Continue to Dashboard
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
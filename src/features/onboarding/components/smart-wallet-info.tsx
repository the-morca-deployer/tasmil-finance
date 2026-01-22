"use client";

import { useState } from "react";
import { Copy, ExternalLink, Wallet, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useSimpleSmartWallet } from "@/hooks/use-simple-smart-wallet";
import { formatAddress } from "@/lib/wallet-utils";
import { toast } from "sonner";

export function SmartWalletInfo() {
  const { resetOnboarding } = useOnboarding();
  const { smartAccount } = useSimpleSmartWallet();
  const [showFullAddress, setShowFullAddress] = useState(false);

  const handleCopyAddress = () => {
    if (smartAccount?.address) {
      navigator.clipboard.writeText(smartAccount.address);
      toast.success("Smart wallet address copied!");
    }
  };

  const handleViewOnExplorer = () => {
    if (smartAccount?.address) {
      const explorerUrl = `https://sepolia.etherscan.io/address/${smartAccount.address}`;
      window.open(explorerUrl, "_blank");
    }
  };

  const handleResetOnboarding = () => {
    resetOnboarding();
    toast.success("Onboarding reset. You can create a new smart wallet.");
  };

  if (!smartAccount?.address) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Smart Wallet
        </CardTitle>
        <CardDescription>
          {smartAccount.isDeployed 
            ? "Your smart wallet is active and ready to use"
            : "Your smart wallet is created but not yet deployed"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={smartAccount.isDeployed 
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-yellow-100 text-yellow-800 border-yellow-200"
            }
          >
            {smartAccount.isDeployed ? "Active" : "Not Deployed"}
          </Badge>
          <Badge variant="outline">
            Sepolia Testnet
          </Badge>
        </div>

        {/* Address Display */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Address</div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-sm font-mono">
              {showFullAddress 
                ? smartAccount.address
                : formatAddress(smartAccount.address, 6)
              }
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullAddress(!showFullAddress)}
              className="h-6 w-6 p-0"
            >
              {showFullAddress ? "..." : "···"}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAddress}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewOnExplorer}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Explorer
          </Button>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Features</div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${smartAccount.isDeployed ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>Gasless transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${smartAccount.isDeployed ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>Enhanced security</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${smartAccount.isDeployed ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>Account recovery</span>
            </div>
          </div>
        </div>

        {/* Reset Button (for development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOnboarding}
              className="w-full text-muted-foreground"
            >
              <Settings className="h-4 w-4 mr-2" />
              Reset Onboarding (Dev Only)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
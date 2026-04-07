"use client";

import { useState } from "react";
import { Copy, ExternalLink, Wallet, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useWallet } from "@/shared/context/wallet-context";
import { toast } from "sonner";

function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function SmartWalletInfo() {
  const { resetOnboarding } = useOnboarding();
  const { address, isConnected } = useWallet();
  const [showFullAddress, setShowFullAddress] = useState(false);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Wallet address copied!");
    }
  };

  const handleViewOnExplorer = () => {
    if (address) {
      const explorerUrl = `https://stellar.expert/explorer/testnet/account/${address}`;
      window.open(explorerUrl, "_blank");
    }
  };

  const handleResetOnboarding = () => {
    resetOnboarding();
    toast.success("Onboarding reset.");
  };

  if (!isConnected || !address) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Stellar Wallet
        </CardTitle>
        <CardDescription>Your wallet is connected and ready to use</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Connected
          </Badge>
          <Badge variant="outline">Stellar Testnet</Badge>
        </div>

        {/* Address Display */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Address</div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-sm font-mono">
              {showFullAddress ? address : formatAddress(address, 6)}
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
          <Button variant="outline" size="sm" onClick={handleCopyAddress} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewOnExplorer} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Explorer
          </Button>
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

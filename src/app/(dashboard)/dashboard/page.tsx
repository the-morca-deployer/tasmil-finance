"use client";

import { CheckCircle2, Copy, DollarSign, ShieldCheck, TrendingUp, Zap, ExternalLink } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { useEffect, useState } from "react";
import { OnboardingDialog, useOnboarding } from "@/features/onboarding";
import { SmartWalletInfo } from "@/features/onboarding/components/smart-wallet-info";
import { DepositDialog } from "@/components/deposit-dialog";
import { WithdrawDialog } from "@/components/withdraw-dialog";
import Image from "next/image";

interface AssetBalance {
  symbol: string;
  balance: string;
  valueUsd: number;
}

// Mock data types
interface RebalancingHistory {
  id: string;
  date: string;
  timeAgo: string;
  chains: {
    name: string;
    icon: string;
  };
  previousPool: string;
  newPool: string;
  amount: number;
  aprChange: number;
}

interface ExecutionHistory {
  id: string;
  action: string;
  date: string;
  timeAgo: string;
  protocol: {
    name: string;
    icon: string;
  };
  amount: number;
  chains: {
    name: string;
    icon: string;
  };
  transactionHash: string;
  zkProof: string;
  validationRegistry: string;
}

// Mock data
const mockRebalancingHistory: RebalancingHistory[] = [
  {
    id: "1",
    date: "3 minutes ago",
    timeAgo: "3m",
    chains: {
      name: "Arbitrum",
      icon: "/token/arb.png"
    },
    previousPool: "Harvest - USDC - 3D Acmes",
    newPool: "Morpho - Gauntlet and USDC",
    amount: 10.03,
    aprChange: 5.33
  }
];

const mockExecutionHistory: ExecutionHistory[] = [
  {
    id: "1",
    action: "Rebalance",
    date: "3 minutes ago",
    timeAgo: "3m",
    protocol: {
      name: "Morpho",
      icon: "/protocol/morpho.svg"
    },
    amount: 10.03,
    chains: {
      name: "Arbitrum",
      icon: "/token/arb.png"
    },
    transactionHash: "0xd66888_7d3Yc65",
    zkProof: "Zk Proof",
    validationRegistry: "Validation Registry"
  },
  {
    id: "2",
    action: "Deposit to protocol",
    date: "7 minutes ago", 
    timeAgo: "7m",
    protocol: {
      name: "Harvest",
      icon: "/protocol/harvest.png"
    },
    amount: 10.03,
    chains: {
      name: "Arbitrum",
      icon: "/token/arb.png"
    },
    transactionHash: "0x4c6e9b_3f6a848",
    zkProof: "Zk Proof",
    validationRegistry: "Validation Registry"
  },
  {
    id: "3",
    action: "Top up wallet",
    date: "9 minutes ago",
    timeAgo: "9m", 
    protocol: {
      name: "USDC",
      icon: "/token/usdc.png"
    },
    amount: 10.03,
    chains: {
      name: "Arbitrum",
      icon: "/token/arb.png"
    },
    transactionHash: "0x77A97_6e67ac",
    zkProof: "",
    validationRegistry: ""
  },
  {
    id: "4",
    action: "Withdraw from protocol",
    date: "9 minutes ago",
    timeAgo: "9m",
    protocol: {
      name: "Harvest",
      icon: "/protocol/harvest.png"
    }, 
    amount: -10.03,
    chains: {
      name: "Arbitrum",
      icon: "/token/arb.png"
    },
    transactionHash: "0xac7f85_6f4abc60",
    zkProof: "",
    validationRegistry: ""
  },
  {
    id: "5",
    action: "Deposit to protocol",
    date: "22 minutes ago",
    timeAgo: "22m",
    protocol: {
      name: "Harvest",
      icon: "/protocol/harvest.png"
    },
    amount: 10.03,
    chains: {
      name: "Arbitrum",
      icon: "/token/arb.png"
    }, 
    transactionHash: "0x5fecaf_e5f6b820",
    zkProof: "Zk Proof",
    validationRegistry: "Validation Registry"
  },
  {
    id: "6",
    action: "Top up wallet",
    date: "23 minutes ago",
    timeAgo: "23m",
    protocol: {
      name: "USDC",
      icon: "/token/usdc.png"
    },
    amount: 10.03,
    chains: {
      name: "Arbitrum",
      icon: "/token/arb.png"
    },
    transactionHash: "0x4b48d_9c7c8048",
    zkProof: "",
    validationRegistry: ""
  }
];

export default function DashboardPage() {
  const { isConnected, connect } = useWallet();
  const [assets] = useState<AssetBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Onboarding
  const {
    isOnboardingOpen,
    completeOnboarding,
    resetOnboarding,
    openOnboarding: _openOnboarding
  } = useOnboarding();

  // Dialogs
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  useEffect(() => {
    if (isConnected) {
      // TODO: Fetch Stellar asset balances via backend API
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Calculate totals with mock data
  const totalValue = assets.length > 0 ? assets.reduce((sum, asset) => sum + (asset.valueUsd || 0), 0) : 10.03;
  const currentAPY = 4.80; // Mock APY from image
  const lifetimeEarnings = 0.00; // Mock lifetime earnings
  const points = 0.00; // Mock points
  const last24hEarnings = 0.00; // Mock 24h earnings
  const rebalancingFrequency = "1x per day";
  const boostStatus = "2x Boost Not Activated";

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <Card className="max-w-md p-8 border-border bg-card">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/40 ring-1 ring-primary/30">
            <DollarSign className="h-10 w-10 text-primary" />
          </div>

          <h2 className="mb-2 text-2xl font-bold text-foreground">Connect Your Wallet</h2>
          <p className="mb-8 text-muted-foreground">Connect your wallet to access your intelligent DeFi dashboard and Agent Swarm.</p>

          <Button onClick={connect} size="lg" className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            Connect Wallet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 p-6 lg:p-10 max-w-[1600px] mx-auto min-h-screen">
      {/* Overlay with Blur */}
      <div className="absolute inset-0 bg-background/30 backdrop-blur-sm z-40 pointer-events-none rounded-lg" />

      {/* Coming Soon Button */}
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto">
        <Button
          size="lg"
          disabled
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg font-semibold"
        >
          Coming Soon
        </Button>
      </div>

      {/* Onboarding Dialog */}
      <OnboardingDialog
        open={isOnboardingOpen}
        onOpenChange={(open) => {
          if (!open) {
            completeOnboarding();
          }
        }}
      />

      {/* Deposit Dialog */}
      <DepositDialog
        open={isDepositOpen}
        onOpenChange={setIsDepositOpen}
      />

      {/* Withdraw Dialog */}
      <WithdrawDialog
        open={isWithdrawOpen}
        onOpenChange={setIsWithdrawOpen}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">FSN's Actual Position</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">D</div>
                DeFiBank_2119
                <Copy className="h-3 w-3" />
              </div>
            </Badge>
            <div className="flex items-center gap-1">
              <span className="text-base text-muted-foreground">Vaults • 100%</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Image src="/protocol/morpho.svg" alt="Morpho" width={24} height={24} className="rounded-full" />
                  <span className="text-base text-muted-foreground">(Gauntlet and USDC)</span>
                </div>
                <Image src="/token/base.png" alt="Base" width={24} height={24} className="rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Test Onboarding Button */}
          <Button
            onClick={resetOnboarding}
            variant="outline"
            size="sm"
          >
            Test Onboarding
          </Button>
        </div>
      </div>

      {/* Hero Grid - Agent Position */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[220px]">

        {/* Portfolio Value */}
        <Card className="lg:col-span-3 flex flex-col justify-between p-6 border-border bg-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-primary/20 transition-all duration-500" />

          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-2">Portfolio Value</p>
            {isLoading ? (
              <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            ) : (
              <h2 className="text-4xl font-bold text-foreground tracking-tight">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            )}
            <p className="text-base text-muted-foreground mt-1 cursor-pointer hover:text-primary transition-colors">See All Assets</p>
          </div>

          <div className="flex gap-3 mt-6 relative z-10">
            <Button 
              onClick={() => setIsDepositOpen(true)}
              className="flex-1 rounded-lg bg-accent hover:bg-accent/80 text-accent-foreground border border-border backdrop-blur-sm"
            >
              Deposit
            </Button>
            <Button 
              onClick={() => setIsWithdrawOpen(true)}
              variant="outline" 
              className="flex-1 rounded-lg border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              Withdraw
            </Button>
          </div>
        </Card>

        {/* Current APY */}
        <Card className="lg:col-span-3 flex flex-col justify-between p-6 border-border bg-card relative overflow-hidden group">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-accent/20 to-accent/40 flex items-center justify-center ring-1 ring-accent/30">
              <TrendingUp className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current APY</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl font-bold text-foreground">{currentAPY.toFixed(2)}%</h2>
                <span className="text-base font-medium text-accent-foreground">+2.02%</span>
              </div>
              <Badge className="mt-3 bg-accent/10 text-accent-foreground border-accent/20 hover:bg-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground mr-2 animate-pulse" />
                rZTI APY Boost
              </Badge>
            </div>
          </div>
        </Card>

        {/* Lifetime Earnings */}
        <Card className="lg:col-span-3 flex flex-col justify-center p-6 border-border bg-card relative overflow-hidden group">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-secondary/20 to-secondary/40 flex items-center justify-center ring-1 ring-secondary/30">
              <DollarSign className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lifetime Earnings</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl font-bold text-foreground">${lifetimeEarnings.toFixed(2)}</h2>
              </div>
              <p className="text-base font-medium text-secondary-foreground mt-1">+ $0.00 rZTI</p>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <p className="text-base text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Details</p>
          </div>
        </Card>


        {/* Points */}
        <Card className="lg:col-span-3 flex flex-col justify-between p-6 border-border bg-card relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center ring-1 ring-primary/30">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Points</p>
                <h2 className="text-3xl font-bold text-foreground mt-1">{points.toFixed(3)}</h2>
                <p className="text-base text-muted-foreground mt-1">Boosted points for referrals</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-8 rounded-full border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent">
              Refer <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
          <div>
            <p className="text-base text-muted-foreground hover:text-foreground cursor-pointer transition-colors">External points</p>
          </div>
        </Card>
      </div>

      {/* Middle Section - Rebalancing Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart Wallet Info */}
        <div className="lg:col-span-1">
          <SmartWalletInfo />
        </div>

        {/* Earnings Chart / Abstract Visual */}
        <Card className="lg:col-span-1 flex flex-col justify-between items-start space-y-4 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">${last24hEarnings.toFixed(2)}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold text-foreground mt-1">
                Last 24h Earnings
              </h2>
              <span className="text-base text-muted-foreground font-medium">+0.00%</span>
            </div>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[65%]" />
          </div>
        </Card>

        {/* Frequency & Boost Status */}
        <Card className="lg:col-span-1 h-[180px] border-border bg-card flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10" />

          <h3 className="text-xl font-bold text-foreground">{rebalancingFrequency}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 flex items-center gap-1">
            Current Rebalancing Frequency <ShieldCheck className="h-3 w-3" />
          </p>

          <div className="bg-muted border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">{boostStatus}</span>
            <ShieldCheck className="h-3 w-3 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Rebalancing Logic Visual */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rebalancing Updates</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">The Agent checks daily to determine the best position to place your liquidity and we use 5 detailed checks to do it:</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {['TVL Safety', 'Delta APY', 'APY Stability Analysis', 'Profit vs. Cost Analysis', 'Money Market'].map((check) => (
            <Badge key={check} variant="outline" className="px-3 py-1.5 border-border bg-muted text-muted-foreground hover:text-foreground hover:border-accent transition-all cursor-default">
              {check} <CheckCircle2 className="ml-2 h-3 w-3 text-accent-foreground" />
            </Badge>
          ))}
        </div>

        {/* History Table */}
        <Card className="mt-6 border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 font-medium text-muted-foreground">Date</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Chains</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Previous Pool</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">New Pool</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground text-right">APR Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockRebalancingHistory.map((item) => (
                  <tr key={item.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-foreground">{item.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <Image 
                          src={item.chains.icon} 
                          alt={item.chains.name} 
                          width={32} 
                          height={32} 
                          className="rounded-full" 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.previousPool}</td>
                    <td className="px-6 py-4 text-foreground font-medium">{item.newPool}</td>
                    <td className="px-6 py-4 text-right text-foreground">${item.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-green-500 font-medium">+ {item.aprChange.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-muted-foreground hover:text-foreground" disabled>Previous</Button>
            <span className="text-base text-muted-foreground font-medium px-2">Page 1 of 1</span>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-muted-foreground hover:text-foreground" disabled>Next</Button>
          </div>
        </Card>
      </div>

      {/* Execution History */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Agent Execution History</h2>
          <Button variant="outline" size="sm" className="h-8 rounded-lg">
            Export CSV
          </Button>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 font-medium text-muted-foreground">Action</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Date</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Protocol Used</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Chains</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Transaction Hash</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">ERC-8004 ZK Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockExecutionHistory.map((item) => (
                  <tr key={item.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-foreground font-medium">{item.action}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Image 
                          src={item.protocol.icon} 
                          alt={item.protocol.name} 
                          width={20} 
                          height={20} 
                          className="rounded-full" 
                        />
                        <span className="text-foreground">{item.protocol.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-foreground">
                      {item.amount > 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Image 
                          src={item.chains.icon} 
                          alt={item.chains.name} 
                          width={16} 
                          height={16} 
                          className="rounded-full" 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-base">{item.transactionHash}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {item.zkProof && (
                          <Button variant="ghost" size="sm" className="h-6 text-base text-blue-500 hover:text-blue-600 p-0 justify-start">
                            {item.zkProof} <Copy className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                        {item.validationRegistry && (
                          <Button variant="ghost" size="sm" className="h-6 text-base text-muted-foreground hover:text-foreground p-0 justify-start">
                            {item.validationRegistry} <ShieldCheck className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-muted-foreground hover:text-foreground" disabled>Previous</Button>
            <span className="text-base text-muted-foreground font-medium px-2">Page 1 of 1</span>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-muted-foreground hover:text-foreground" disabled>Next</Button>
          </div>
        </Card>
      </div>

    </div>
  );
}

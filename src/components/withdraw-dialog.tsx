"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHAINS = [
  { id: "base", name: "Base", icon: "/token/base.png", selected: true },
  { id: "arbitrum", name: "Arbitrum", icon: "/token/arb.png", selected: false },
  { id: "solana", name: "Solana", icon: "/token/solana.png", selected: false },
  { id: "plasma", name: "Plasma", icon: "/token/plasma.svg", selected: false }
];

export function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
  const [selectedChains, setSelectedChains] = useState(["base"]);
  const [amount, setAmount] = useState("0.00");

  const toggleChain = (chainId: string) => {
    if (selectedChains.includes(chainId)) {
      setSelectedChains(selectedChains.filter(id => id !== chainId));
    } else {
      setSelectedChains([...selectedChains, chainId]);
    }
  };

  const handleWithdraw = () => {
    console.log("Withdrawing:", { amount, chains: selectedChains });
    // Add withdraw logic here
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full bg-card border border-border/50 overflow-hidden rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Withdraw Your Balance on Base</h2>
            <Image src="/token/base.png" alt="Base" width={24} height={24} className="rounded-full" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Chain Selection */}
          <div>
            <p className="text-base font-semibold text-foreground mb-4">Select the chain from which you want to withdraw:</p>
            <div className="grid grid-cols-2 gap-4">
              {CHAINS.map((chain) => (
                <div
                  key={chain.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300",
                    selectedChains.includes(chain.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/30"
                  )}
                  onClick={() => toggleChain(chain.id)}
                >
                  <Image 
                    src={chain.icon} 
                    alt={chain.name} 
                    width={32} 
                    height={32} 
                    className="rounded-full" 
                  />
                  <div className="flex-1">
                    <span className="text-base font-medium block">{chain.name}</span>
                  </div>
                  <Checkbox
                    checked={selectedChains.includes(chain.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-right pr-24 h-14 bg-muted/30 border-border/50 rounded-xl text-lg"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-muted-foreground text-base">0.00 USDC</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full">
                  <Image src="/token/usdc.png" alt="USDC" width={16} height={16} className="rounded-full" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
            <p className="text-foreground text-sm">
              Funds will be deducted from your position(s) and sent to your wallet.
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              <strong>Note:</strong> Amounts being deposited into yield strategies cannot be withdrawn (takes ~1/2 minutes).
            </p>
          </div>

          {/* Withdraw Button */}
          <Button
            onClick={handleWithdraw}
            size="lg"
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-base font-semibold"
          >
            Withdraw
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHAINS = [
  { id: "base", name: "Base", icon: "/token/base.png", selected: false },
  { id: "arbitrum", name: "Arbitrum", icon: "/token/arb.png", selected: false },
  { id: "plasma", name: "Plasma", icon: "/token/plasma.svg", selected: true }
];

export function DepositDialog({ open, onOpenChange }: DepositDialogProps) {
  const [selectedChains, setSelectedChains] = useState(["plasma"]);
  const [amount, setAmount] = useState("0.00");

  const toggleChain = (chainId: string) => {
    if (selectedChains.includes(chainId)) {
      setSelectedChains(selectedChains.filter(id => id !== chainId));
    } else {
      setSelectedChains([...selectedChains, chainId]);
    }
  };

  const handleDeposit = () => {
    console.log("Depositing:", { amount, chains: selectedChains });
    // Add deposit logic here
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full bg-card border border-border/50 overflow-hidden rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Deposit USDT on Plasma</h2>
            <Image src="/token/plasma.svg" alt="Plasma" width={24} height={24} className="rounded-full" />
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
            <p className="text-base font-semibold text-foreground mb-4">Select the chain from which you want to deposit:</p>
            <div className="flex gap-4">
              {CHAINS.map((chain) => (
                <div
                  key={chain.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 min-w-[120px]",
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
                <span className="text-muted-foreground text-base">0.00 USDT</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full">
                  <Image src="/token/usdt.png" alt="USDT" width={16} height={16} className="rounded-full" />
                </Button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average APY</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">7.50%</span>
                  <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                    <Image src="/icons/info.svg" alt="Info" width={12} height={12} />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Projected monthly earnings</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">+$0.00 / month</span>
                  <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                    <Image src="/icons/info.svg" alt="Info" width={12} height={12} />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Projected yearly earnings</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">+$0.00 / year</span>
                  <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                    <Image src="/icons/info.svg" alt="Info" width={12} height={12} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Deposit Button */}
          <Button
            onClick={handleDeposit}
            size="lg"
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-base font-semibold"
          >
            Deposit
          </Button>

          {/* Smart Wallet Notice */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Note:</strong> You can't deposit to Plasma because you don't have a smart wallet deployed there. 
              Please select and deploy your Plasma smart wallet{" "}
              <button className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">
                here
              </button>
            </p>
          </div>

          {/* Terms */}
          <div className="text-sm text-muted-foreground">
            By depositing, you agree to the{" "}
            <button className="text-primary underline hover:text-primary/80">
              Terms and Conditions
            </button>{" "}
            and{" "}
            <button className="text-primary underline hover:text-primary/80">
              Privacy Policy
            </button>{" "}
            of the platform.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
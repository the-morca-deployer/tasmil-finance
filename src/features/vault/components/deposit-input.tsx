"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";

import { QUICK_AMOUNTS } from "../constants";
import type { QuickAmount } from "../types";

interface DepositInputProps {
  value: number;
  onChange: (value: number) => void;
  maxBalance?: number;
  onDeposit: () => void;
  isLoading?: boolean;
  className?: string;
}

export function DepositInput({
  value,
  onChange,
  maxBalance = 10000,
  onDeposit,
  isLoading,
  className,
}: DepositInputProps) {
  const [inputValue, setInputValue] = useState(value > 0 ? value.toString() : "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    setInputValue(val);
    const numVal = parseFloat(val) || 0;
    onChange(numVal);
  };

  const handleQuickAmount = (amount: QuickAmount) => {
    const numAmount = amount === "MAX" ? maxBalance : amount;
    setInputValue(numAmount.toString());
    onChange(numAmount);
  };

  const progress = maxBalance > 0 ? Math.min((value / maxBalance) * 100, 100) : 0;

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      {/* Amount Input */}
      <div className="relative mb-4">
        <span className="absolute top-1/2 left-4 -translate-y-1/2 font-bold text-2xl text-muted-foreground">
          $
        </span>
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="0"
          className="h-16 border-none bg-transparent pl-10 font-bold text-3xl focus-visible:ring-0"
        />
      </div>

      {/* Quick Amount Buttons */}
      <div className="mb-6 flex gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAmount(amount)}
            className={cn(
              "flex-1",
              value === (amount === "MAX" ? maxBalance : amount) &&
                "border-primary bg-primary/10"
            )}
          >
            {amount === "MAX" ? "MAX" : `$${amount.toLocaleString()}`}
          </Button>
        ))}
      </div>

      {/* Deposit Button with Progress */}
      <div className="space-y-3">
        <Button
          variant="gradient"
          size="lg"
          className="h-14 w-full text-lg"
          onClick={onDeposit}
          disabled={value <= 0 || isLoading}
        >
          {isLoading ? "Processing..." : `DEPOSIT $${value.toLocaleString()}`}
        </Button>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>{progress.toFixed(0)}% of balance</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

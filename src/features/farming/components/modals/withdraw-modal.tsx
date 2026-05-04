"use client";

import { Loader2 } from "lucide-react";
import { useId } from "react";
import { Button } from "@/shared/ui/button-v2";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface WithdrawModalProps {
  availableUsd: number;
  lockedUsd: number;
  amount: string;
  onAmountChange: (next: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function WithdrawModal({
  availableUsd,
  lockedUsd,
  amount,
  onAmountChange,
  onSubmit,
  isPending,
}: WithdrawModalProps) {
  const inputId = useId();
  const parsed = Number.parseFloat(amount);
  const valid = !Number.isNaN(parsed) && parsed > 0 && parsed <= availableUsd;

  return (
    <div className="space-y-4 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">Available (instant)</p>
          <p className="text-lg font-semibold text-foreground">{formatUsd(availableUsd)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">Locked (backstop)</p>
          <p className="text-lg font-semibold text-foreground">{formatUsd(lockedUsd)}</p>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-xs text-muted-foreground">
          Withdraw amount (USD)
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="number"
            min="0"
            max={availableUsd}
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
          />
          <Button
            variant="outline"
            size="default"
            className="shrink-0"
            onClick={() => onAmountChange(availableUsd.toFixed(2))}
            disabled={isPending || availableUsd <= 0}
          >
            Max
          </Button>
        </div>
      </div>
      <Button
        variant="gradient"
        size="lg"
        className="h-12 w-full"
        onClick={onSubmit}
        disabled={!valid || isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Withdraw
      </Button>
    </div>
  );
}

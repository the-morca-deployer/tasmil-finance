"use client";

import { CheckCircle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { VAULT_CONFIG } from "../constants";
import type { DepositModalState } from "../types";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: DepositModalState;
  onConfirm: () => void;
}

export function DepositModal({ open, onOpenChange, state, onConfirm }: DepositModalProps) {
  const isProcessing = state.status === "pending" || state.status === "confirming";
  const isSuccess = state.status === "success";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? "Deposit Complete!" : `Deposit to ${VAULT_CONFIG.name}`}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "Your deposit has been confirmed"
              : "Review your deposit details before confirming"}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <SuccessView amount={state.amount} shares={state.estimatedShares} />
        ) : (
          <DepositDetails state={state} isProcessing={isProcessing} onConfirm={onConfirm} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface DepositDetailsProps {
  state: DepositModalState;
  isProcessing: boolean;
  onConfirm: () => void;
}

function DepositDetails({ state, isProcessing, onConfirm }: DepositDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="space-y-3">
        <DetailRow label="Amount" value={`$${state.amount.toLocaleString()}`} />
        <DetailRow
          label="You'll receive"
          value={`${state.estimatedShares.toLocaleString()} ${VAULT_CONFIG.shareToken} shares`}
        />
        <DetailRow label="Estimated APY" value={`${state.estimatedApy}%`} highlight />
      </div>

      {/* Network Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-muted-foreground text-xs">Network</div>
          <div className="font-medium">{VAULT_CONFIG.network}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-muted-foreground text-xs">Gas</div>
          <div className="font-medium">~${state.gasEstimate.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-muted-foreground text-xs">Arrival</div>
          <div className="font-medium">&lt;30 seconds</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-muted-foreground text-xs">Status</div>
          <div className="font-medium text-green-500">Ready</div>
        </div>
      </div>

      {/* Confirm Button */}
      <Button
        variant="gradient"
        size="lg"
        className="h-12 w-full"
        onClick={onConfirm}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {state.status === "pending" ? "Waiting for wallet..." : "Confirming..."}
          </>
        ) : (
          "CONFIRM IN METAMASK"
        )}
      </Button>
    </div>
  );
}

interface SuccessViewProps {
  amount: number;
  shares: number;
}

function SuccessView({ amount, shares }: SuccessViewProps) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      <div className="mb-2 font-bold text-2xl">${amount.toLocaleString()}</div>
      <div className="text-muted-foreground">
        Successfully deposited • {shares.toLocaleString()} {VAULT_CONFIG.shareToken} shares
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function DetailRow({ label, value, highlight }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", highlight && "text-green-500")}>{value}</span>
    </div>
  );
}

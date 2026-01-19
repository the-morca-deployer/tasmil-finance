"use client";

import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@/shared/ui/button-v2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { VAULT_CONFIG, WITHDRAW_CONFIG } from "../constants";
import type { WithdrawModalState } from "../types";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: WithdrawModalState;
  onConfirm: () => void;
  onEmergencyToggle: (isEmergency: boolean) => void;
}

export function WithdrawModal({
  open,
  onOpenChange,
  state,
  onConfirm,
  onEmergencyToggle,
}: WithdrawModalProps) {
  const isProcessing = state.status === "pending" || state.status === "confirming";
  const isSuccess = state.status === "success";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? "Withdrawal Complete!" : `Withdraw from ${VAULT_CONFIG.name}`}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "Your withdrawal has been processed"
              : "Review your withdrawal details"}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <SuccessView amount={state.receiveAmount} />
        ) : (
          <WithdrawDetails
            state={state}
            isProcessing={isProcessing}
            onConfirm={onConfirm}
            onEmergencyToggle={onEmergencyToggle}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface WithdrawDetailsProps {
  state: WithdrawModalState;
  isProcessing: boolean;
  onConfirm: () => void;
  onEmergencyToggle: (isEmergency: boolean) => void;
}

function WithdrawDetails({
  state,
  isProcessing,
  onConfirm,
  onEmergencyToggle,
}: WithdrawDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="space-y-3">
        <DetailRow label="Withdraw" value={`$${state.amount.toLocaleString()}`} />
        <DetailRow
          label="You'll receive"
          value={`$${state.receiveAmount.toLocaleString()} ${VAULT_CONFIG.token}`}
        />
        <DetailRow
          label="Remaining"
          value={`$${state.remaining.toFixed(2)} (100%)`}
        />
      </div>

      {/* Emergency Withdrawal Option */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-500" />
          <div className="flex-1">
            <div className="font-medium">Strategies unwind in</div>
            <div className="text-muted-foreground text-sm">{WITHDRAW_CONFIG.standardUnwindTime}</div>
          </div>
        </div>

        <Button
          variant={state.isEmergency ? "destructive" : "outline"}
          size="sm"
          className="w-full"
          onClick={() => onEmergencyToggle(!state.isEmergency)}
        >
          {state.isEmergency ? "✓ Emergency Withdrawal Selected" : "EMERGENCY WITHDRAWAL"}
        </Button>

        <div className="mt-2 text-center text-muted-foreground text-xs">
          Instant, {WITHDRAW_CONFIG.emergencyFee}% fee
          {state.isEmergency && state.fee > 0 && (
            <span className="text-yellow-500"> (Fee: ${state.fee.toFixed(2)})</span>
          )}
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
            {state.status === "pending" ? "Waiting for wallet..." : "Processing..."}
          </>
        ) : (
          "CONFIRM WITHDRAWAL"
        )}
      </Button>
    </div>
  );
}

interface SuccessViewProps {
  amount: number;
}

function SuccessView({ amount }: SuccessViewProps) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      <div className="mb-2 font-bold text-2xl">${amount.toLocaleString()}</div>
      <div className="text-muted-foreground">
        Successfully withdrawn to your wallet
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

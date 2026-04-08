"use client";

import { ArrowUpRight, CheckCircle, AlertCircle } from "lucide-react";
import { memo } from "react";
import { BaseInfoCard } from "../base/info-card";
import { useResultData } from "../../hooks/use-result-data";
import { getExplorerUrl, truncateAddress } from "@/shared/config/stellar";

interface TxSubmitCardProps {
  operation?: string;
  args?: Record<string, any>;
  result?: unknown;
  toolCallId?: string;
  status?: string;
  respond?: (result: Record<string, unknown>) => void;
}

function TxSubmitCardComponent({ result, status }: TxSubmitCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData(result, status);

  const txResult = data?.result ?? data;
  const txHash = txResult?.id ?? txResult?.hash ?? txResult?.transactionHash;
  const isSuccess = data?.success !== false && txHash;

  if (isSuccess) {
    const explorerUrl = getExplorerUrl("tx", txHash);

    return (
      <BaseInfoCard
        title="Transaction Submitted"
        icon={CheckCircle}
        iconColor="text-green-600"
        iconBg="bg-green-500/10"
        isLoading={isLoading}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">TX Hash</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{truncateAddress(txHash)}</span>
              <a
                className="flex h-6 w-6 items-center justify-center rounded-full bg-background/30 transition-colors hover:text-foreground"
                href={explorerUrl}
                rel="noopener noreferrer"
                target="_blank"
                title="View on Stellar Expert"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
            <p className="text-green-700 dark:text-green-300 text-sm">
              Transaction submitted successfully!
            </p>
          </div>
        </div>
      </BaseInfoCard>
    );
  }

  return (
    <BaseInfoCard
      title="Transaction Failed"
      icon={AlertCircle}
      iconColor="text-destructive"
      iconBg="bg-destructive/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
        <p className="text-destructive text-sm">
          {data?.error ?? "Transaction submission failed."}
        </p>
      </div>
    </BaseInfoCard>
  );
}

export const TxSubmitCard = memo(TxSubmitCardComponent);

"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { useStreamContext } from "@/features/chat/hooks/use-stream";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";
import { useTxSigning } from "../../hooks/use-tx-signing";
import { cleanVaultName, fmtAmount, fmtGas, trunc } from "../../lib/formatting";
import type { CardMode } from "../../schemas/common.schema";
import type { DefindexTxCardProps } from "../../schemas/defindex.schema";

const OP_CONFIG: Record<string, { label: string; verb: string; action: string }> = {
  vault_deposit: { label: "Deposit", verb: "to deposit", action: "Sign & Deposit" },
  vault_withdraw: { label: "Withdraw", verb: "to withdraw", action: "Sign & Withdraw" },
  vault_withdraw_amounts: { label: "Withdraw", verb: "to withdraw", action: "Sign & Withdraw" },
};

const DEFAULT_OP = { label: "Transaction", verb: "", action: "Sign & Submit" };

interface Props {
  tx: DefindexTxCardProps;
  mode?: CardMode;
  stream?: any;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
}

export function DefindexTxCard({
  tx,
  mode = "playground",
  stream: streamProp,
  toolCallId,
  respond,
}: Props) {
  const cfg = OP_CONFIG[tx.operation] ?? DEFAULT_OP;

  // Context from API enrichment
  const ctx = tx.context;
  const assetSymbol = ctx?.asset ?? tx.asset ?? "—";
  const vaultDisplayName = ctx?.vaultName
    ? cleanVaultName(ctx.vaultName)
    : tx.vaultName
      ? cleanVaultName(tx.vaultName)
      : null;
  const totalAmount = tx.amounts?.reduce((sum, a) => sum + Number(a), 0)?.toString() ?? "0";
  const rawFee = tx.estimatedFee ?? "0";
  const hasFee = Number(rawFee) > 0;
  const apy = ctx?.apy ?? tx.apy;
  const xdr = tx.xdr;

  const chatStream = useStreamContext();
  const stream = mode === "chat" ? chatStream : streamProp;

  const { sign, cancel, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation: tx.operation,
    respond,
    volumeContext: {
      protocol: "defindex",
      operation: tx.operation,
      asset: assetSymbol,
      amount: totalAmount,
    },
  });

  const [showXdr, setShowXdr] = useState(false);
  const cancelled =
    txResult !== null && !txResult.success && txResult.message === "Transaction cancelled";

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-lg font-semibold text-foreground">Confirm {cfg.label}</p>
        <p className="text-xs text-muted-foreground">Review details before signing</p>
      </div>

      {/* Detail rows */}
      <div className="px-5 pb-3 space-y-0">
        {/* Amount */}
        <div className="flex justify-between py-2.5 border-b border-border/30">
          <span className="text-sm text-muted-foreground">Amount {cfg.verb}</span>
          <span className="text-sm text-foreground font-medium tabular-nums flex items-center gap-1.5">
            <TokenImage src={null} alt={assetSymbol} className="h-5 w-5 rounded-full" />
            {fmtAmount(totalAmount)} {assetSymbol}
          </span>
        </div>

        {/* Fee — only show if non-zero */}
        {hasFee && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Maximum transaction fee</span>
            <span className="text-sm text-foreground tabular-nums">{fmtGas(rawFee)}</span>
          </div>
        )}

        {/* APY */}
        {apy != null && apy > 0 && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Vault APY</span>
            <span className="text-sm font-medium text-emerald-400 tabular-nums">
              {apy.toFixed(2)}%
            </span>
          </div>
        )}

        {/* Vault name with link to explorer */}
        {(vaultDisplayName || tx.vaultAddress) && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Vault</span>
            {tx.vaultAddress ? (
              <a
                href={getExplorerUrl("account", tx.vaultAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground underline inline-flex items-center gap-1"
              >
                {vaultDisplayName ?? trunc(tx.vaultAddress)}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-sm font-medium text-foreground">{vaultDisplayName}</span>
            )}
          </div>
        )}

        {/* Vault fees */}
        {ctx?.feesBps && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Fees</span>
            <span className="text-sm text-muted-foreground/80 tabular-nums">
              {(ctx.feesBps.vaultFee / 100).toFixed(1)}% vault +{" "}
              {(ctx.feesBps.defindexFee / 100).toFixed(1)}% protocol
            </span>
          </div>
        )}
      </div>

      {/* XDR toggle */}
      <div className="px-5 pb-2">
        <button
          type="button"
          onClick={() => setShowXdr(!showXdr)}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {showXdr ? "Hide XDR" : "Show XDR"}
        </button>
        {showXdr && (
          <pre className="mt-1 max-h-[100px] overflow-auto rounded-lg bg-secondary p-2 text-[10px] text-muted-foreground font-mono break-all">
            {xdr}
          </pre>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Action area */}
      <div className="px-4 py-3">
        {txResult?.success ? (
          <a
            href={getExplorerUrl("tx", txResult.hash ?? "")}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg py-2 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center hover:bg-emerald-500/15 transition-colors"
          >
            Transaction confirmed · {trunc(txResult.hash ?? "")}
          </a>
        ) : txError ? (
          <div className="rounded-lg py-2 px-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive text-center">
            Failed · {txError.length > 80 ? txError.slice(0, 80) + "\u2026" : txError}
          </div>
        ) : cancelled ? (
          <div className="rounded-lg py-2 px-3 text-xs bg-muted border border-border text-muted-foreground text-center">
            Transaction cancelled
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg py-2 text-xs font-semibold border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-[0.98]"
              onClick={() => cancel()}
              disabled={signing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg py-2 text-xs font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              onClick={() => sign(xdr)}
              disabled={signing || !xdr}
            >
              {signing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...
                </>
              ) : (
                cfg.action
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

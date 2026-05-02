"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { TokenImage } from "@/shared/components/token-image";
import { useTxSigning } from "@/features/protocols/hooks/use-tx-signing";
import { getExplorerUrl } from "@/shared/config/stellar";
import { fmtGas, fmt, trunc } from "@/features/protocols/lib/formatting";

// ─── Props ──────────────────────────────────────────────────────

export interface SwapExecuteCardProps {
  operation: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut?: string | null;
  routeTokens?: string[];
  routePools?: string[];
  xdr: string;
  protocol?: string;
  estimatedFee?: string;
  context?: Record<string, unknown>;
}

interface SwapExecuteCardComponentProps {
  tx: SwapExecuteCardProps;
  mode?: "chat" | "playground";
  stream?: any;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
}

// ─── Component ──────────────────────────────────────────────────

export function SwapExecuteCard({
  tx,
  mode = "chat",
  stream,
  toolCallId,
  respond,
}: SwapExecuteCardComponentProps) {
  const xdr = tx.xdr;
  const fee = tx.estimatedFee ?? "0";
  const routeTokens = tx.routeTokens ?? [];
  const firstToken = routeTokens[0] ?? tx.tokenIn ?? "";
  const lastToken = routeTokens[routeTokens.length - 1] ?? tx.tokenOut ?? "";
  const amountIn = Number(tx.amountIn);
  const estOutput = tx.amountOut ? Number(tx.amountOut) / 1e7 : null;
  const exchangeRate = amountIn > 0 && estOutput != null ? estOutput / (amountIn / 1e7) : null;
  const pools = tx.routePools;

  const { sign, cancel, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation: tx.operation,
    respond,
    volumeContext: {
      protocol: tx.protocol ?? "swap",
      operation: tx.operation,
      asset: firstToken,
      amount: tx.amountIn,
    },
  });

  const [showXdr, setShowXdr] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const handleSign = () => sign(xdr);

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-lg font-semibold text-foreground">
          Confirm Swap
          {tx.protocol ? (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground capitalize">
              via {tx.protocol}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          Review amounts, rate, and fees before confirming
        </p>
      </div>

      {/* Token direction */}
      {routeTokens.length >= 2 ? (
        <div className="px-5 py-3">
          <div className="relative flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
              <TokenImage src={null} alt={firstToken} className="h-8 w-8 rounded-full" />
              <p className="text-base font-medium text-foreground">{firstToken}</p>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center z-10">
              <span className="text-muted-foreground text-sm">{"\u2192"}</span>
            </div>
            <div className="flex-1 flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
              <TokenImage src={null} alt={lastToken} className="h-8 w-8 rounded-full" />
              <p className="text-base font-medium text-foreground">{lastToken}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3">
          <div className="flex items-center justify-center gap-4 rounded-2xl bg-secondary/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <TokenImage src={null} alt={firstToken} className="h-8 w-8 rounded-full" />
              <p className="text-base font-medium text-foreground">{firstToken || "?"}</p>
            </div>
            <span className="text-muted-foreground text-lg">{"\u2192"}</span>
            <div className="flex items-center gap-2">
              <TokenImage src={null} alt={lastToken} className="h-8 w-8 rounded-full" />
              <p className="text-base font-medium text-foreground">{lastToken || "?"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Detail rows */}
      <div className="px-5 pb-3 space-y-0">
        <div className="flex justify-between py-2.5 border-b border-border/30">
          <span className="text-sm text-muted-foreground">You give</span>
          <span className="text-sm text-foreground font-medium tabular-nums">
            {fmt(amountIn / 1e7, 7)} {firstToken}
          </span>
        </div>
        {estOutput != null && estOutput > 0 ? (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">You get (estimate)</span>
            <span className="text-sm text-foreground font-medium tabular-nums">
              {fmt(estOutput, 7)} {lastToken}
            </span>
          </div>
        ) : null}
        {exchangeRate != null && exchangeRate > 0 ? (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Exchange rate</span>
            <span className="text-sm text-foreground tabular-nums">
              1 {firstToken} = {exchangeRate.toFixed(7)} {lastToken}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between py-2.5 border-b border-border/30">
          <span className="text-sm text-muted-foreground">Maximum transaction fee</span>
          <span className="text-sm text-foreground tabular-nums">{fmtGas(fee)}</span>
        </div>
      </div>

      {/* Pools route */}
      {pools && pools.length > 0 && routeTokens.length > 1 ? (
        <div className="px-5 pb-3">
          <p className="text-xs text-muted-foreground mb-2">Route</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {pools.map((pool, i) => (
              <span key={pool} className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full border border-border/50 bg-secondary/40 px-2.5 py-1.5">
                  <TokenImage
                    src={null}
                    alt={routeTokens[i] ?? "?"}
                    className="h-5 w-5 rounded-full"
                  />
                  <TokenImage
                    src={null}
                    alt={routeTokens[i + 1] ?? "?"}
                    className="h-5 w-5 rounded-full"
                  />
                </span>
                {i < pools.length - 1 ? (
                  <span className="text-muted-foreground/40 text-sm">{"\u2192"}</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}

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

      {/* Divider */}
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
            Transaction confirmed {"\u00B7"} {trunc(txResult.hash ?? "")}
          </a>
        ) : txError ? (
          <div className="rounded-lg py-2 px-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive text-center">
            Failed {"\u00B7"} {txError.length > 80 ? txError.slice(0, 80) + "\u2026" : txError}
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
              disabled={signing}
              onClick={() => {
                setCancelled(true);
                cancel();
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg py-2 text-xs font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              onClick={handleSign}
              disabled={signing || !xdr}
            >
              {signing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...
                </>
              ) : (
                "Sign & Swap"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

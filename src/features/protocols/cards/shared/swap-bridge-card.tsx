"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  ArrowLeftRight,
  Clock,
  Info,
  Loader2,
} from "lucide-react";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import type { SwapBridgeCardProps } from "../../schemas/shared.schema";
import { ProtocolCard } from "../base/protocol-card";
import { useTxSigning } from "../../hooks/use-tx-signing";
import { useStreamContext } from "@/features/chat/hooks/use-stream";
import { getExplorerUrl } from "@/shared/config/stellar";
import { trunc } from "../../lib/formatting";

// ─── Operation config ───────────────────────────────────────────

const OP_LABELS: Record<string, { label: string; icon: typeof ArrowLeftRight }> = {
  swap: { label: "Swap", icon: ArrowLeftRight },
  bridge: { label: "Bridge", icon: ArrowLeftRight },
  add_liquidity: { label: "Add Liquidity", icon: ArrowUpDown },
  remove_liquidity: { label: "Remove Liquidity", icon: ArrowUpDown },
};

// ─── Props ──────────────────────────────────────────────────────

interface SwapBridgeCardComponentProps {
  data: SwapBridgeCardProps;
  mode?: CardMode;
  stream?: any;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
}

// ─── Component ──────────────────────────────────────────────────

export function SwapBridgeCard({
  data,
  mode = "playground",
  stream: streamProp,
  toolCallId,
  respond,
}: SwapBridgeCardComponentProps) {
  const operation = data.operation ?? "swap";
  const opCfg = OP_LABELS[operation] ?? OP_LABELS.swap ?? { label: "Swap", icon: ArrowLeftRight };
  const protocolLabel =
    data.protocol.charAt(0).toUpperCase() + data.protocol.slice(1);

  const chatStream = useStreamContext();
  const stream = mode === "chat" ? chatStream : streamProp;

  const { sign, cancel, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation,
    respond,
    volumeContext: {
      protocol: data.protocol,
      operation,
      asset: data.tokenIn,
      amount: data.amountIn,
    },
  });

  const [showXdr, setShowXdr] = useState(false);
  const cancelled =
    txResult !== null &&
    !txResult.success &&
    txResult.message === "Transaction cancelled";

  const handleSign = () => sign(data.xdr);
  const handleCancel = () => cancel();

  const isBridge = operation === "bridge";

  // ─── Chat mode (compact) ───────────────────────────────────────

  if (mode === "chat") {
    return (
      <ProtocolCard
        mode="chat"
        title={`${opCfg.label} via ${protocolLabel}`}
        icon={opCfg.icon}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      >
        <div className="space-y-3">
          {/* You pay */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">You pay</p>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
              <TokenImage src={null} alt={data.tokenIn} className="h-6 w-6 rounded-full" />
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {data.amountIn}
              </span>
              <span className="text-sm text-muted-foreground">{data.tokenIn}</span>
              {isBridge && data.sourceChain && (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {data.sourceChain}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* You receive */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">You receive</p>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
              <TokenImage src={null} alt={data.tokenOut} className="h-6 w-6 rounded-full" />
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {data.amountOut}
              </span>
              <span className="text-sm text-muted-foreground">{data.tokenOut}</span>
              {isBridge && data.destChain && (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {data.destChain}
                </span>
              )}
            </div>
          </div>

          {/* Fee / Gas / Time */}
          <div className="space-y-1 pt-1">
            {(data.fee || data.feeAmount) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3 w-3 shrink-0" />
                <span>
                  Fee {data.fee ?? ""}{data.feeAmount ? ` (${data.feeAmount})` : ""}
                </span>
                {data.gasEstimate && (
                  <span className="ml-1">
                    {"\u00B7"} Gas ~{data.gasEstimate}
                  </span>
                )}
              </div>
            )}
            {data.estimatedTime && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Est. time ~{data.estimatedTime}</span>
              </div>
            )}
            {data.route && data.route.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowLeftRight className="h-3 w-3 shrink-0" />
                <span>Route: {data.route.join(" \u2192 ")}</span>
              </div>
            )}
          </div>

          {/* Actions */}
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
              Failed {"\u00B7"}{" "}
              {txError.length > 80 ? txError.slice(0, 80) + "\u2026" : txError}
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
                onClick={handleCancel}
                disabled={signing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg py-2 text-xs font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                onClick={handleSign}
                disabled={signing || !data.xdr}
              >
                {signing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...
                  </>
                ) : (
                  "Confirm & Sign"
                )}
              </button>
            </div>
          )}
        </div>
      </ProtocolCard>
    );
  }

  // ─── Playground mode ───────────────────────────────────────────

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex items-center gap-2">
        <opCfg.icon className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-lg font-semibold text-foreground">
            {opCfg.label} via {protocolLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            Review details before signing
          </p>
        </div>
      </div>

      {/* You pay */}
      <div className="px-5 pb-1">
        <p className="text-sm text-muted-foreground mb-1.5">You pay</p>
        <div className="flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
          <TokenImage src={null} alt={data.tokenIn} className="h-8 w-8 rounded-full" />
          <div className="flex-1 min-w-0">
            <span className="text-lg font-semibold text-foreground tabular-nums">
              {data.amountIn}
            </span>
            <span className="ml-1.5 text-sm text-muted-foreground">{data.tokenIn}</span>
          </div>
          {isBridge && data.sourceChain && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {data.sourceChain}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center py-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card z-10">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* You receive */}
      <div className="px-5 pb-3">
        <p className="text-sm text-muted-foreground mb-1.5">You receive</p>
        <div className="flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
          <TokenImage src={null} alt={data.tokenOut} className="h-8 w-8 rounded-full" />
          <div className="flex-1 min-w-0">
            <span className="text-lg font-semibold text-foreground tabular-nums">
              {data.amountOut}
            </span>
            <span className="ml-1.5 text-sm text-muted-foreground">{data.tokenOut}</span>
          </div>
          {isBridge && data.destChain && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {data.destChain}
            </span>
          )}
        </div>
      </div>

      {/* Fee / Gas / Time / Route */}
      <div className="px-5 pb-3 space-y-0">
        {(data.fee || data.feeAmount || data.gasEstimate) && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Fee</span>
            <span className="text-sm text-foreground tabular-nums">
              {data.fee ?? ""}{data.feeAmount ? ` (${data.feeAmount})` : ""}
              {data.gasEstimate ? ` \u00B7 Gas ~${data.gasEstimate}` : ""}
            </span>
          </div>
        )}
        {data.estimatedTime && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Est. time</span>
            <span className="text-sm text-foreground tabular-nums">~{data.estimatedTime}</span>
          </div>
        )}
        {data.route && data.route.length > 1 && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Route</span>
            <span className="text-sm text-foreground tabular-nums">
              {data.route.join(" \u2192 ")}
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
            {data.xdr}
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
            Transaction confirmed {"\u00B7"} {trunc(txResult.hash ?? "")}
          </a>
        ) : txError ? (
          <div className="rounded-lg py-2 px-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive text-center">
            Failed {"\u00B7"}{" "}
            {txError.length > 80 ? txError.slice(0, 80) + "\u2026" : txError}
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
              onClick={handleCancel}
              disabled={signing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg py-2 text-xs font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              onClick={handleSign}
              disabled={signing || !data.xdr}
            >
              {signing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...
                </>
              ) : (
                "Confirm & Sign"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { Crown, Globe } from "lucide-react";
import { memo } from "react";
import { useResultData } from "../../hooks/use-result-data";
import { formatEstimatedTime } from "../../lib/formatting";
import { DetailRow, ProtocolBadge, ScrollableList, StatusBadge } from "../base/indicators";
import { BaseInfoCard } from "../base/info-card";

interface BridgeQuote {
  provider: string;
  amountIn: string;
  amountOut: string;
  fee: string;
  feePercent: string;
  estimatedTime: string;
  crossChainSwap: boolean;
  depositAddress?: string;
  depositMemo?: string;
  status: string;
  error?: string;
}

interface BridgeData {
  quotes: BridgeQuote[];
  best: string;
}

interface BridgeDiscoveryCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

function BridgeDiscoveryCardComponent({
  args,
  result,
  toolCallId,
  status,
}: BridgeDiscoveryCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<BridgeData>(result, status);

  const fromChain = args?.fromChain ?? "?";
  const toChain = args?.toChain ?? "?";
  const tokenIn = args?.tokenIn ?? "";

  return (
    <BaseInfoCard
      data-testid="card-bridge-discovery"
      title="Bridge Quotes"
      subtitle={`${fromChain} → ${toChain}${tokenIn ? ` (${tokenIn})` : ""}`}
      icon={Globe}
      iconColor="text-purple-500"
      iconBg="bg-purple-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {data?.quotes && data.quotes.length > 0 ? (
        <ScrollableList id={`bridge-quotes-${toolCallId}`} maxHeight={300}>
          {data.quotes.map((quote, idx) => {
            const isBest = quote.provider === data.best;
            const isAvailable = quote.status === "ok";

            return (
              <div
                key={`${quote.provider}-${idx}`}
                className={`space-y-2 rounded-lg border p-3 ${
                  isBest ? "border-green-500/40 bg-green-500/5" : "border-border"
                } ${!isAvailable ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ProtocolBadge name={quote.provider} />
                    {isBest && (
                      <span className="flex items-center gap-1 font-medium text-green-500 text-xs">
                        <Crown className="h-3 w-3" /> Best
                      </span>
                    )}
                    {quote.crossChainSwap && (
                      <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-blue-500 text-xs">
                        cross-chain
                      </span>
                    )}
                  </div>
                  <StatusBadge status={quote.status} />
                </div>

                {isAvailable && (
                  <>
                    <div className="space-y-1">
                      <DetailRow label="Send" value={quote.amountIn} />
                      <DetailRow
                        label="Receive"
                        value={<span className="font-semibold">{quote.amountOut}</span>}
                      />
                      <DetailRow label="Fee" value={`${quote.fee} (${quote.feePercent}%)`} />
                      <DetailRow
                        label="Est. Time"
                        value={formatEstimatedTime(quote.estimatedTime)}
                      />
                    </div>

                    {quote.depositAddress && (
                      <div className="mt-2 border-t pt-2 text-muted-foreground text-xs">
                        Deposit to: <span className="font-mono">{quote.depositAddress}</span>
                        {quote.depositMemo && (
                          <>
                            {" "}
                            | Memo: <span className="font-mono">{quote.depositMemo}</span>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {!isAvailable && quote.error && (
                  <div className="text-red-500 text-xs">{quote.error}</div>
                )}
              </div>
            );
          })}
        </ScrollableList>
      ) : (
        <div className="text-muted-foreground text-sm">No bridge routes available.</div>
      )}
    </BaseInfoCard>
  );
}

export const BridgeDiscoveryCard = memo(BridgeDiscoveryCardComponent);

"use client";

import { ArrowRightLeft, Crown } from "lucide-react";
import { memo } from "react";
import { useResultData } from "../../hooks/use-result-data";
import { formatEstimatedTime } from "../../lib/formatting";
import { ProtocolBadge, ScrollableList, StatusBadge } from "../base/indicators";
import { BaseInfoCard } from "../base/info-card";

interface SwapQuote {
  protocol: string;
  amountIn: string;
  amountOut: string;
  fee: string;
  feePercent: string;
  priceImpact?: string;
  route: string[];
  estimatedTime: string;
  poolAddress?: string;
  status: string;
  error?: string;
}

interface SwapQuoteData {
  quotes: SwapQuote[];
  best: string;
}

interface SwapQuoteCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

function SwapQuoteCardComponent({ args, result, toolCallId, status }: SwapQuoteCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<SwapQuoteData>(result, status);

  const tokenIn = args?.tokenIn ?? "?";
  const tokenOut = args?.tokenOut ?? "?";

  return (
    <BaseInfoCard
      data-testid="card-swap-quote"
      title="Swap Quotes"
      subtitle={`${tokenIn} → ${tokenOut}`}
      icon={ArrowRightLeft}
      iconColor="text-blue-500"
      iconBg="bg-blue-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {data?.quotes && data.quotes.length > 0 ? (
        <ScrollableList id={`swap-quotes-${toolCallId}`} maxHeight={320}>
          {data.quotes
            .filter((q) => q.status === "ok")
            .map((quote, idx) => {
              const isBest = quote.protocol === data.best;
              return (
                <div
                  key={`${quote.protocol}-${idx}`}
                  className={`space-y-2 rounded-lg border p-3 ${
                    isBest ? "border-green-500/40 bg-green-500/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ProtocolBadge name={quote.protocol} />
                      {isBest && (
                        <span className="flex items-center gap-1 font-medium text-green-500 text-xs">
                          <Crown className="h-3 w-3" /> Best
                        </span>
                      )}
                    </div>
                    <StatusBadge status={quote.status} />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {quote.amountIn} {tokenIn}
                    </span>
                    <ArrowRightLeft className="mx-2 h-3 w-3 text-muted-foreground" />
                    <span className="font-semibold">
                      {quote.amountOut} {tokenOut}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-muted-foreground text-xs">
                    <div>
                      <div className="text-muted-foreground/70">Fee</div>
                      <div>{quote.feePercent}%</div>
                    </div>
                    {quote.priceImpact && (
                      <div>
                        <div className="text-muted-foreground/70">Impact</div>
                        <div className={Number(quote.priceImpact) > 3 ? "text-red-500" : ""}>
                          {quote.priceImpact}%
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-muted-foreground/70">Time</div>
                      <div>{formatEstimatedTime(quote.estimatedTime)}</div>
                    </div>
                  </div>

                  {quote.route && quote.route.length > 1 && (
                    <div className="text-muted-foreground text-xs">
                      Route: {quote.route.join(" → ")}
                    </div>
                  )}
                </div>
              );
            })}

          {data.quotes.filter((q) => q.status !== "ok").length > 0 && (
            <div className="pt-1 text-muted-foreground text-xs">
              {data.quotes.filter((q) => q.status !== "ok").length} protocol(s) unavailable
            </div>
          )}
        </ScrollableList>
      ) : (
        <div className="text-muted-foreground text-sm">No swap quotes available.</div>
      )}
    </BaseInfoCard>
  );
}

export const SwapQuoteCard = memo(SwapQuoteCardComponent);

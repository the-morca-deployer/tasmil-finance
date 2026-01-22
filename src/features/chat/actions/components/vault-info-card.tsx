"use client";

/**
 * Vault Info UI Component
 * 
 * Renders read-only vault information from backend tools.
 * Used with LoadExternalComponent pattern.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Loader2, Wallet, TrendingUp, Coins, Settings, BarChart3 } from "lucide-react";

interface VaultInfoProps {
  type: "status" | "read" | "total_assets" | "user_shares" | "strategy_info" | "preview_deposit" | "preview_withdraw";
  args: Record<string, unknown>;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
  };
  toolName: string;
}

const TITLE_MAP = {
  status: "Vault Status",
  read: "Vault Data",
  total_assets: "Total Assets",
  user_shares: "Your Shares",
  strategy_info: "Strategy Info",
  preview_deposit: "Deposit Preview",
  preview_withdraw: "Withdrawal Preview",
};

const ICON_MAP = {
  status: Wallet,
  read: BarChart3,
  total_assets: Coins,
  user_shares: TrendingUp,
  strategy_info: Settings,
  preview_deposit: Coins,
  preview_withdraw: TrendingUp,
};

/**
 * Format USDC amount (6 decimals) to human readable
 */
function formatUSDCAmount(amount: string | number | undefined): string {
  if (!amount) return "0";
  try {
    const num = parseFloat(String(amount));
    if (num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch {
    return String(amount);
  }
}

/**
 * Format vault shares to human readable
 */
function formatSharesAmount(shares: string | number | undefined): string {
  if (!shares) return "0";
  try {
    const num = parseFloat(String(shares));
    if (num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch {
    return String(shares);
  }
}

export function VaultInfoCard({ type, args, result, toolName }: VaultInfoProps) {
  const title = TITLE_MAP[type] || "Vault Info";
  const Icon = ICON_MAP[type] || Wallet;
  const isLoading = !result;
  const hasError = result && !result.success;

  console.log("[VaultInfoCard] Render:", {
    type,
    args,
    result,
    toolName,
    isLoading,
    hasError,
  });

  // Extract data from result - handle both formats
  const data = result?.data || result;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {hasError && (
          <div className="text-sm text-destructive">
            {result.error || "Failed to load data"}
          </div>
        )}

        {result && result.success && (
          <div className="space-y-2">
            {/* Vault Address */}
            {(args["vaultAddress"] || data?.address) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vault:</span>
                <span className="font-mono text-xs">
                  {String(args["vaultAddress"] || data?.address).slice(0, 6)}...
                  {String(args["vaultAddress"] || data?.address).slice(-4)}
                </span>
              </div>
            )}

            {/* Display data based on type */}
            {type === "status" && data && (
              <>
                {data.tvl !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value Locked:</span>
                    <span className="font-semibold text-green-600">
                      ${formatUSDCAmount(data.tvl)}
                    </span>
                  </div>
                )}
                {data.totalAssets !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Assets:</span>
                    <span className="font-medium">{formatUSDCAmount(data.totalAssets)} USDC</span>
                  </div>
                )}
                {data.totalSupply !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Supply:</span>
                    <span className="font-medium">{formatSharesAmount(data.totalSupply)} shares</span>
                  </div>
                )}
                {data.strategyCount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Strategies:</span>
                    <span className="font-medium">{data.strategyCount}</span>
                  </div>
                )}
                {data.strategies && Array.isArray(data.strategies) && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Strategies:</div>
                    {data.strategies.map((strategy: any, idx: number) => (
                      <div key={idx} className="text-xs bg-muted/30 rounded p-2 mb-1">
                        <div className="font-mono">{strategy.address?.slice(0, 10)}...</div>
                        <div>Debt: {formatUSDCAmount(strategy.currentDebt)} USDC</div>
                        {strategy.weight !== undefined && (
                          <div>Weight: {strategy.weight}%</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {type === "total_assets" && data?.totalAssets !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Assets:</span>
                <span className="font-semibold text-green-600">
                  {formatUSDCAmount(data.totalAssets)} USDC
                </span>
              </div>
            )}

            {type === "user_shares" && data && (
              <>
                {data.shares !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your Shares:</span>
                    <span className="font-medium">{formatSharesAmount(data.shares)} shares</span>
                  </div>
                )}
                {data.value !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Share Value:</span>
                    <span className="font-semibold text-green-600">
                      {formatUSDCAmount(data.value)} USDC
                    </span>
                  </div>
                )}
              </>
            )}

            {type === "strategy_info" && data && (
              <>
                {data.address && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Strategy:</span>
                    <span className="font-mono text-xs">
                      {data.address.slice(0, 6)}...{data.address.slice(-4)}
                    </span>
                  </div>
                )}
                {data.currentDebt !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Debt:</span>
                    <span className="font-medium">{formatUSDCAmount(data.currentDebt)} USDC</span>
                  </div>
                )}
                {data.maxDebt !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Debt:</span>
                    <span className="font-medium">{formatUSDCAmount(data.maxDebt)} USDC</span>
                  </div>
                )}
                {data.weight !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{data.weight}%</span>
                  </div>
                )}
              </>
            )}

            {type === "preview_deposit" && data && (
              <>
                {data.shares !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares to Receive:</span>
                    <span className="font-semibold text-green-600">
                      {formatSharesAmount(data.shares)} shares
                    </span>
                  </div>
                )}
                {data.pricePerShare !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price per Share:</span>
                    <span className="font-medium">{formatUSDCAmount(data.pricePerShare)} USDC</span>
                  </div>
                )}
              </>
            )}

            {type === "preview_withdraw" && data && (
              <>
                {data.assets !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">USDC to Receive:</span>
                    <span className="font-semibold text-green-600">
                      {formatUSDCAmount(data.assets)} USDC
                    </span>
                  </div>
                )}
                {data.pricePerShare !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price per Share:</span>
                    <span className="font-medium">{formatUSDCAmount(data.pricePerShare)} USDC</span>
                  </div>
                )}
              </>
            )}

            {type === "read" && data && (
              <>
                {data.result !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Result:</span>
                    <span className="font-medium">{String(data.result)}</span>
                  </div>
                )}
                {data.functionName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Function:</span>
                    <span className="font-mono text-xs">{data.functionName}</span>
                  </div>
                )}
              </>
            )}

            {/* Raw data fallback for debugging */}
            {!["status", "total_assets", "user_shares", "strategy_info", "preview_deposit", "preview_withdraw", "read"].includes(type) && data && (
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
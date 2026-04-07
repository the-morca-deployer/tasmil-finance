"use client";

// 🎨 Vault operation card component for wallet interactions
// Uses HITL pattern: when user signs transaction, result is sent back to agent via respond()
// This ensures transaction results are persisted in thread messages

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Coins,
  Loader2,
  TrendingUp,
  Settings,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";

/** Format a bigint value with the given number of decimals */
function formatUnits(value: bigint, decimals: number): string {
  const str = value.toString().padStart(decimals + 1, "0");
  const intPart = str.slice(0, str.length - decimals) || "0";
  const fracPart = str.slice(str.length - decimals);
  return `${intPart}.${fracPart}`;
}
import {
  useVaultDeposit,
  useVaultWithdraw,
  useVaultRedeem,
  useVaultApprove,
} from "@/features/chat/hooks/use-vault-operations";

type VaultOperation =
  | "deposit"
  | "withdraw"
  | "redeem"
  | "rebalance"
  | "set_weights"
  | "set_weights_and_rebalance"
  | "approve_asset"
  | "harvest";

interface VaultOperationCardProps {
  operation: VaultOperation;
  args: Record<string, unknown>;
  result: unknown;
  status: "pending" | "executing" | "complete" | "error" | "inProgress";
  // respond from useHumanInTheLoop - sends result back to agent
  respond?: (result: Record<string, unknown>) => void;
}

const OPERATION_CONFIG: Record<
  VaultOperation,
  {
    title: string;
    buttonText: string;
    icon: typeof Coins;
    iconColor: string;
    bgColor: string;
  }
> = {
  deposit: {
    title: "Vault Deposit",
    buttonText: "Deposit USDC",
    icon: Coins,
    iconColor: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  withdraw: {
    title: "Vault Withdrawal",
    buttonText: "Withdraw USDC",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  redeem: {
    title: "Redeem Shares",
    buttonText: "Redeem Shares",
    icon: Wallet,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  rebalance: {
    title: "Vault Rebalance",
    buttonText: "Rebalance Vault",
    icon: Settings,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  set_weights: {
    title: "Set Strategy Weights",
    buttonText: "Set Weights",
    icon: Settings,
    iconColor: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  set_weights_and_rebalance: {
    title: "Set Weights & Rebalance",
    buttonText: "Set & Rebalance",
    icon: Settings,
    iconColor: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  approve_asset: {
    title: "Approve USDC",
    buttonText: "Approve USDC",
    icon: CheckCircle,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  harvest: {
    title: "Harvest Rewards",
    buttonText: "Harvest Rewards",
    icon: Coins,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
};

/**
 * Format USDC amount (6 decimals) to human readable
 */
function formatUSDCAmount(amount: string | number | undefined): string {
  if (!amount) return "";
  try {
    const wei = BigInt(String(amount));
    const formatted = formatUnits(wei, 6); // USDC has 6 decimals
    const num = parseFloat(formatted);
    if (num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch {
    return String(amount);
  }
}

/**
 * Format vault shares (18 decimals) to human readable
 */
function formatSharesAmount(shares: string | number | undefined): string {
  if (!shares) return "";
  try {
    const wei = BigInt(String(shares));
    const formatted = formatUnits(wei, 18); // Vault shares have 18 decimals
    const num = parseFloat(formatted);
    if (num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch {
    return String(shares);
  }
}

export function VaultOperationCard({
  operation,
  args,
  result,
  status,
  respond,
}: VaultOperationCardProps) {
  const { address, isConnected } = useWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [txResult, setTxResult] = useState<{
    success: boolean;
    hash?: string;
    message: string;
  } | null>(null);

  // Vault hooks
  const vaultDeposit = useVaultDeposit();
  const vaultWithdraw = useVaultWithdraw();
  const vaultRedeem = useVaultRedeem();
  const vaultApprove = useVaultApprove();

  const config = OPERATION_CONFIG[operation];
  const Icon = config.icon;

  // Extract operation details from args (from HITL actionRequest.args)
  const data = args || {};
  
  // DEBUG: Log the data structure
  console.log("[VaultOperationCard] Debug:", {
    operation,
    args,
    result,
    status,
    data,
  });
  
  const vaultAddress = data["vaultAddress"] || "0x3f924889717554AF7C6F835dBB08B5f977649804"; // Default from MCP
  const amount = data["amount"];
  const shares = data["shares"];
  const weights = data["weights"];
  const spender = data["spender"] || "0xdc33a923312ecdCdbEF793CB35f2f07A7f5b4bF0"; // For approve operations
  const receiver = data["receiver"] || data["receiverAddress"];
  const owner = data["owner"] || data["ownerAddress"];
  const strategies = data["strategies"];

  // Format amounts
  const amountFormatted: string | undefined = amount
    ? `${formatUSDCAmount(amount as string)} USDC`
    : undefined;
  const sharesFormatted: string | undefined = shares
    ? `${formatSharesAmount(shares as string)} shares`
    : undefined;

  // Use result from CopilotKit (persisted) or local txResult
  const persistedResult = result as Record<string, unknown> | undefined;
  const hasPersistedResult = persistedResult && persistedResult["success"] !== undefined;

  const effectiveResult =
    txResult ||
    (hasPersistedResult
      ? {
          success: Boolean(persistedResult["success"]),
          hash: persistedResult["hash"] as string | undefined,
          message: String(
            persistedResult["message"] ||
              (persistedResult["success"] ? "Transaction successful!" : "Transaction failed")
          ),
        }
      : null);

  // Check if any hook is pending
  const isPending =
    vaultDeposit.isPending ||
    vaultWithdraw.isPending ||
    vaultRedeem.isPending ||
    vaultApprove.isPending ||
    isExecuting;

  // Card width class
  const cardWidthClass = "w-fit min-w-[280px]";

  // Handle wallet transaction using vault hooks
  const handleExecute = async () => {
    if (!isConnected || !address) {
      setTxResult({
        success: false,
        message: "Wallet not connected",
      });
      respond?.({
        success: false,
        error: "Wallet not connected",
      });
      return;
    }

    setIsExecuting(true);

    try {
      let walletResult;
      const vaultAddr = String(vaultAddress);
      const amountStr = String(amount || "0");
      const sharesStr = String(shares || "0");

      switch (operation) {
        case "deposit":
          if (!amount) throw new Error("Amount is required for deposit");
          walletResult = await vaultDeposit.deposit(vaultAddr, amountStr);
          break;

        case "withdraw":
          if (!amount) throw new Error("Amount is required for withdrawal");
          walletResult = await vaultWithdraw.withdraw(vaultAddr, amountStr);
          break;

        case "redeem":
          if (!shares) throw new Error("Shares amount is required for redemption");
          walletResult = await vaultRedeem.redeem(vaultAddr, sharesStr);
          break;

        case "approve_asset":
          if (!spender || !amount) throw new Error("Spender and amount are required for approval");
          walletResult = await vaultApprove.approve(String(spender), amountStr);
          break;

        case "rebalance":
        case "set_weights":
        case "set_weights_and_rebalance":
        case "harvest":
          // These operations are typically admin/keeper functions
          throw new Error(`${operation} requires admin/keeper privileges and cannot be executed directly from the UI`);

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      setTxResult({
        success: true,
        hash: walletResult.hash,
        message: walletResult.isConfirmed ? "Transaction confirmed!" : "Transaction submitted!",
      });

      // Send result back to agent
      respond?.({
        success: true,
        hash: walletResult.hash,
        isConfirmed: walletResult.isConfirmed,
        operation,
        vaultAddress: vaultAddr,
        amount: amountFormatted,
        shares: sharesFormatted,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";

      setTxResult({
        success: false,
        message: errorMessage,
      });

      // Send result back to agent
      respond?.({
        success: false,
        error: errorMessage,
        operation,
        vaultAddress: String(vaultAddress),
        amount: amountFormatted,
        shares: sharesFormatted,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Show completed transaction UI
  const isSuccess = effectiveResult?.success === true && effectiveResult?.hash;
  const isFailed = effectiveResult?.success === false;

  if (isSuccess || (status === "complete" && !isFailed && effectiveResult?.hash)) {
    const hash = effectiveResult?.hash;
    const truncatedHash = hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : "";
    const explorerUrl = hash ? `https://arbiscan.io/tx/${hash}` : "";

    return (
      <div className={`${cardWidthClass} rounded-lg border bg-card/40 p-6 shadow-sm`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold">Transaction Completed</h3>
            <p className="text-muted-foreground text-sm">{config.title} was successful</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vault</span>
            <span className="font-mono text-xs">
              {String(vaultAddress).slice(0, 6)}...{String(vaultAddress).slice(-4)}
            </span>
          </div>
          {amountFormatted && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{amountFormatted}</span>
            </div>
          )}
          {sharesFormatted && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shares</span>
              <span className="font-semibold">{sharesFormatted}</span>
            </div>
          )}
          {hash && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Transaction Hash</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs">{truncatedHash}</span>
                <a
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-background/30 transition-colors hover:text-foreground"
                  href={explorerUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="View on Arbiscan"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
          <p className="text-green-700 dark:text-green-300 text-sm">
            {effectiveResult?.message || "Transaction completed successfully!"}
          </p>
        </div>
      </div>
    );
  }

  // Show failed transaction UI
  if (isFailed || (status === "complete" && effectiveResult?.success === false)) {
    const errorMessage = effectiveResult?.message || "Transaction failed";

    return (
      <div className={`${cardWidthClass} rounded-lg border bg-card p-6 shadow-sm`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold">Transaction Failed</h3>
            <p className="text-muted-foreground text-sm">{config.title}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vault</span>
            <span className="font-mono text-xs">
              {String(vaultAddress).slice(0, 6)}...{String(vaultAddress).slice(-4)}
            </span>
          </div>
          {amountFormatted && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{amountFormatted}</span>
            </div>
          )}
          {sharesFormatted && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shares</span>
              <span className="font-semibold">{sharesFormatted}</span>
            </div>
          )}
        </div>

        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-destructive text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (status === "pending") {
    return (
      <div className={`${cardWidthClass} rounded-lg border bg-card/40 p-6 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor}`}
          >
            <Loader2 className={`h-5 w-5 ${config.iconColor} animate-spin`} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{config.title}</h3>
            <p className="text-muted-foreground text-sm">Preparing transaction...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show pending operation UI (ready for wallet interaction)
  return (
    <div className={`${cardWidthClass} rounded-lg border bg-card p-6 shadow-sm`}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
        >
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-semibold">{config.title}</h3>
          <p className="text-muted-foreground text-sm">
            Click the button below to sign the transaction
          </p>
        </div>
      </div>

      {/* Operation Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Vault</span>
          <span className="font-mono text-xs">
            {String(vaultAddress).slice(0, 6)}...{String(vaultAddress).slice(-4)}
          </span>
        </div>

        {amountFormatted && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{amountFormatted}</span>
          </div>
        )}

        {sharesFormatted && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shares</span>
            <span className="font-semibold">{sharesFormatted}</span>
          </div>
        )}

        {receiver != null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Receiver</span>
            <span className="font-mono text-xs">
              {String(receiver).slice(0, 6)}...{String(receiver).slice(-4)}
            </span>
          </div>
        )}

        {owner != null && String(owner) !== String(receiver) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Owner</span>
            <span className="font-mono text-xs">
              {String(owner).slice(0, 6)}...{String(owner).slice(-4)}
            </span>
          </div>
        )}

        {strategies != null && Array.isArray(strategies) && (
          <div className="space-y-1">
            <span className="text-muted-foreground text-sm">Strategies</span>
            {(strategies as string[]).map((strategy: string, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="font-mono text-xs">
                  {String(strategy).slice(0, 6)}...{String(strategy).slice(-4)}
                </span>
              </div>
            ))}
          </div>
        )}

        {weights != null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Weights</span>
            <span className="font-semibold">
              {Array.isArray(weights) 
                ? weights.map(w => String(w)).join(", ") 
                : String(weights)
              }
            </span>
          </div>
        )}

        {spender != null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spender</span>
            <span className="font-mono text-xs">
              {String(spender).slice(0, 6)}...{String(spender).slice(-4)}
            </span>
          </div>
        )}
      </div>

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Please connect your wallet to proceed.</span>
          </div>
        </div>
      )}

      {/* Admin/Keeper Operations Warning */}
      {["rebalance", "set_weights", "set_weights_and_rebalance", "harvest"].includes(operation) && (
        <div className="mb-4 rounded-md border border-orange-500/30 bg-orange-500/10 p-3">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>This operation requires admin/keeper privileges.</span>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={
          !isConnected || 
          isPending ||
          ["rebalance", "set_weights", "set_weights_and_rebalance", "harvest"].includes(operation)
        }
        className="w-full h-10 rounded-lg"
        variant="default"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          config.buttonText
        )}
      </Button>
    </div>
  );
}
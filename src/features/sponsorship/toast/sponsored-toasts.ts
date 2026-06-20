import { toast } from "sonner";
import { stroopsToXlm, txExplorerUrl, truncateHash } from "..";

interface ShowTxToastsArgs {
  sponsored: boolean;
  txHash: string;
  sponsoredFeeStroops: string;
  txCount: number;
  maxTxPerUser: number;
  network: "mainnet" | "testnet";
}

/**
 * Surface the two success toasts after a FE-initiated TX:
 * - Toast 1 (always): "Transaction submitted" with hash + Stellar Expert action
 * - Toast 2 (only when sponsored): "Gas sponsored by Tasmil" + XLM amount + usage
 */
export function showTxToasts(args: ShowTxToastsArgs) {
  toast.success("Transaction submitted", {
    description: truncateHash(args.txHash),
    duration: 6000,
    action: {
      label: "View on Stellar Expert",
      onClick: () =>
        window.open(
          txExplorerUrl(args.network, args.txHash),
          "_blank",
          "noopener,noreferrer",
        ),
    },
  });

  if (!args.sponsored) return;

  setTimeout(() => {
    toast.success("Gas sponsored by Tasmil", {
      description: `We covered ${stroopsToXlm(args.sponsoredFeeStroops)} XLM in network fees · ${args.txCount + 1} of ${args.maxTxPerUser} sponsored TXs used`,
      duration: 8000,
    });
  }, 150);
}

export function showTxErrorToast(err: unknown) {
  toast.error("Transaction failed", {
    description: err instanceof Error ? err.message : "Unknown error",
  });
}

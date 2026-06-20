import { sponsorshipApi } from "./api";
import { showTxErrorToast, showTxToasts } from "./toast/sponsored-toasts";
import type { SponsorshipMe } from "./types";

export interface SponsorTxMeta {
  action: "DEPOSIT" | "WITHDRAW" | "REBALANCE" | "HARVEST";
  protocol: "TASMIL_VAULT" | "BLEND" | "SOROSWAP" | "AQUARIUS" | "PHOENIX" | "DEFINDEX";
  asset?: string;
  poolLabel?: string;
}

/**
 * Drop-in replacement for direct Horizon submission. Routes the inner XDR
 * through the backend `/tx/submit-with-sponsor` endpoint which conditionally
 * wraps it in a sponsor fee-bump. Fires the two-toast UX (submitted + sponsored)
 * on success, or an error toast on failure.
 *
 * Caller is responsible for catching the rethrown error so its own state
 * machine can transition. Returns the same `{ hash }` shape as the previous
 * direct-submit helpers, plus `sponsored` so callers can update local UI.
 *
 * Usage example (in submitSignedXdr or useFarmingActions):
 *
 *   const r = await submitWithSponsorFlow(signedXdr, me, {
 *     action: "DEPOSIT",
 *     protocol: "BLEND",
 *     asset: "USDC",
 *     poolLabel: "Blend USDC pool",
 *   });
 *   return { hash: r.hash };
 */
export async function submitWithSponsorFlow(
  signedInnerXdr: string,
  me: SponsorshipMe | undefined,
  meta: SponsorTxMeta
): Promise<{ hash: string; sponsored: boolean }> {
  try {
    const result = await sponsorshipApi.submitWithSponsor({
      signedInnerXdr,
      meta,
    });

    showTxToasts({
      sponsored: result.sponsored,
      txHash: result.txHash,
      sponsoredFeeStroops: result.sponsoredFeeStroops,
      txCount: me?.usage?.txCount ?? 0,
      maxTxPerUser: me?.config.maxTxPerUser ?? 5,
      network: (me?.config.network ?? "mainnet") as "mainnet" | "testnet",
    });

    return { hash: result.txHash, sponsored: result.sponsored };
  } catch (err) {
    showTxErrorToast(err);
    throw err;
  }
}

export { showTxToasts, showTxErrorToast };

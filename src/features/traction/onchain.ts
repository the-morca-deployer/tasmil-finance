import { z } from "zod";

/**
 * Response contracts for GET /api/public/traction/onchain(/txs). Parsed with
 * zod because this is public evidence: a malformed payload must fail loudly
 * rather than render misleading numbers.
 */

const totals = z.object({
  tvlUsd: z.number(),
  volumeUsd: z.number(),
  transactions: z.number().int().nonnegative(),
  wallets: z.number().int().nonnegative(),
});

const venue = z.object({
  venue: z.string(),
  symbol: z.string().nullable(),
  balanceBaseUnits: z.string(),
  volumeBaseUnits: z.string(),
  tvlUsd: z.number().nullable(),
  volumeUsd: z.number().nullable(),
});

export const onchainTractionSchema = z.object({
  summary: totals.extend({ split: z.object({ vault: totals, userSigned: totals }) }),
  series: z.array(
    z.object({
      day: z.string(),
      tvlUsd: z.number(),
      volumeUsd: z.number(),
      transactions: z.number(),
      wallets: z.number(),
    })
  ),
  range: z.object({
    fromLedger: z.number().nullable(),
    toLedger: z.number().nullable(),
    fromTime: z.string().nullable(),
    toTime: z.string().nullable(),
  }),
  contracts: z.object({ executionRouter: z.string().nullable(), venues: z.array(venue) }),
  coverage: z.object({
    state: z.enum(["FULL", "PARTIAL", "UNAVAILABLE"]),
    reasons: z.array(z.string()),
  }),
  verification: z.object({
    verified: z.number(),
    failed: z.number(),
    notFound: z.number(),
  }),
  methodology: z.array(z.string()),
  snapshotDay: z.string().nullable(),
  updatedAt: z.string(),
});

export const onchainTxSchema = z.object({
  txHash: z.string(),
  source: z.enum(["VAULT", "USER_SIGNED"]),
  ledger: z.number(),
  closedAt: z.string(),
  wallet: z.string(),
  kind: z.string(),
  amountUsd: z.number().nullable(),
});

export const onchainTxPageSchema = z.object({
  items: z.array(onchainTxSchema),
  nextCursor: z.string().nullable(),
});

export type OnchainTraction = z.infer<typeof onchainTractionSchema>;
export type OnchainTx = z.infer<typeof onchainTxSchema>;
export type OnchainTxPage = z.infer<typeof onchainTxPageSchema>;

const EXPLORER = "https://stellar.expert/explorer/public";

export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`;

/** Contracts (C...) and accounts (G...) live under different explorer paths. */
export const explorerAddress = (address: string) =>
  `${EXPLORER}/${address.startsWith("C") ? "contract" : "account"}/${address}`;

export const shortHash = (value: string) =>
  value.length <= 12 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;

const REASON_LABELS: Record<string, string> = {
  router_not_configured: "Vault router not configured yet - vault figures are empty",
  ledger_gap: "Some ledgers could not be indexed (RPC retention gap)",
  no_snapshot_yet: "First snapshot has not been computed yet",
};

export function describeReason(reason: string): string {
  if (REASON_LABELS[reason]) return REASON_LABELS[reason];
  const [kind, value] = reason.split(":");
  if (kind === "pending_verification")
    return `${value} transaction(s) still awaiting Horizon confirmation`;
  if (kind === "price_unavailable") return `No USD price for venue ${shortHash(value ?? "")}`;
  return reason;
}

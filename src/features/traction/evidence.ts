import { z } from "zod";

const unsignedIntegerString = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, "expected a canonical unsigned integer string");
const safeCount = z.number().int().nonnegative().safe();
const contractId = z.string().regex(/^C[A-Z2-7]{55}$/, "expected a Stellar contract ID");

const venueAmount = z
  .object({
    venue: contractId,
    amountBaseUnits: unsignedIntegerString,
  })
  .strict();

const venueBalance = z
  .object({
    venue: contractId,
    balanceBaseUnits: unsignedIntegerString,
  })
  .strict();

const publicLedgerSchema = z
  .object({
    state: z.enum(["FULL", "PARTIAL"]),
    network: z.literal("mainnet"),
    sourceContract: contractId,
    range: z
      .object({
        requestedStartLedger: unsignedIntegerString,
        effectiveStartLedger: unsignedIntegerString,
        oldestLedger: unsignedIntegerString,
        latestLedger: unsignedIntegerString,
        truncated: z.boolean(),
      })
      .strict(),
    transactionCount: safeCount,
    walletCount: safeCount,
    volumeByVenue: z.array(venueAmount),
    tvlByVenue: z.array(venueBalance),
    horizon: z
      .object({
        endpoint: z.string().url(),
        state: z.enum(["VERIFIED", "PARTIAL", "UNAVAILABLE"]),
        verifiedTransactions: safeCount,
      })
      .strict(),
    rawEventDigest: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict()
  .superRefine((ledger, context) => {
    if (
      ledger.state === "FULL" &&
      (ledger.range.requestedStartLedger !== ledger.range.effectiveStartLedger ||
        ledger.range.truncated ||
        ledger.horizon.state !== "VERIFIED")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["state"],
        message: "FULL evidence requires an unpruned, untruncated and Horizon-verified range",
      });
    }
    if (ledger.horizon.verifiedTransactions > ledger.transactionCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horizon", "verifiedTransactions"],
        message: "verified transaction count exceeds the public-ledger count",
      });
    }
  });

const summarySchema = z
  .object({
    totalTvlUsd: z.number().finite(),
    totalUsers: safeCount,
    appWallets: safeCount,
    questWallets: safeCount,
    avgApyPercent: z.number().finite(),
    totalTransactions: safeCount,
  })
  .strict();

const tractionSchema = z
  .object({
    summary: summarySchema,
    volumeTvl: z.array(
      z
        .object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          volumeUsd: z.number().finite(),
          cumulativeTvlUsd: z.number().finite(),
        })
        .strict()
    ),
    userGrowth: z.array(
      z
        .object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          newUsers: safeCount,
          cumulativeUsers: safeCount,
        })
        .strict()
    ),
    txByType: z.array(z.object({ type: z.string().min(1), count: safeCount }).strict()),
    publicLedger: publicLedgerSchema,
    reconciliation: z
      .object({
        cachedTransactionCount: safeCount,
        publicLedgerTransactionCount: safeCount,
        transactionCountDelta: z.number().int().safe(),
        registeredUsers: safeCount,
        publicLedgerWallets: safeCount,
      })
      .strict(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict()
  .superRefine((data, context) => {
    const reconciliationValid =
      data.reconciliation.publicLedgerTransactionCount === data.publicLedger.transactionCount &&
      data.reconciliation.publicLedgerWallets === data.publicLedger.walletCount &&
      data.reconciliation.transactionCountDelta ===
        data.reconciliation.cachedTransactionCount - data.publicLedger.transactionCount;
    if (!reconciliationValid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reconciliation"],
        message: "reconciliation metadata disagrees with public-ledger evidence",
      });
    }
  });

export type TractionData = z.infer<typeof tractionSchema>;
export type PublicLedgerEvidence = TractionData["publicLedger"];

export function parseTractionData(value: unknown): TractionData {
  return tractionSchema.parse(value);
}

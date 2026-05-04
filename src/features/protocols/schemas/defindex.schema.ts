import { z } from "zod";

// ─── Vault list item ──────────────────────────────────────────

export const defindexVaultCardSchema = z.object({
  address: z.string(),
  name: z.string(),
  asset: z.string().optional(),
  assetAddress: z.string().optional(),
  totalSupply: z.string().nullable().optional(),
  tvl: z.union([z.string(), z.number()]).nullable().optional(),
  apy: z.number().nullable().optional(),
  status: z.enum(["ok", "unavailable"]).catch("unavailable"),
});
export type DefindexVaultCardProps = z.infer<typeof defindexVaultCardSchema>;

// ─── Strategy ──────────────────────────────────────────────────

export const defindexStrategySchema = z.object({
  address: z.string(),
  name: z.string(),
  paused: z.boolean(),
});
export type DefindexStrategyProps = z.infer<typeof defindexStrategySchema>;

// ─── Vault asset ───────────────────────────────────────────────

export const defindexVaultAssetSchema = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
  strategies: z.array(defindexStrategySchema),
});
export type DefindexVaultAssetProps = z.infer<typeof defindexVaultAssetSchema>;

// ─── Fund breakdown ────────────────────────────────────────────

export const defindexStrategyAllocationSchema = z.object({
  amount: z.string(),
  paused: z.boolean(),
  strategy_address: z.string(),
});

export const defindexFundBreakdownSchema = z.object({
  asset: z.string(),
  idle_amount: z.string(),
  invested_amount: z.string(),
  strategy_allocations: z.array(defindexStrategyAllocationSchema),
  total_amount: z.string(),
});
export type DefindexFundBreakdownProps = z.infer<typeof defindexFundBreakdownSchema>;

// ─── Vault detail ──────────────────────────────────────────────

export const defindexVaultDetailSchema = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  roles: z
    .object({
      manager: z.string(),
      emergencyManager: z.string(),
      rebalanceManager: z.string(),
      feeReceiver: z.string(),
    })
    .optional(),
  assets: z.array(defindexVaultAssetSchema).optional(),
  totalManagedFunds: z.array(defindexFundBreakdownSchema).optional(),
  feesBps: z
    .object({
      vaultFee: z.number(),
      defindexFee: z.number(),
    })
    .optional(),
  apy: z.number().nullable().optional(),
  status: z.enum(["ok", "unavailable"]).catch("unavailable"),
});
export type DefindexVaultDetailProps = z.infer<typeof defindexVaultDetailSchema>;

// ─── User balance ──────────────────────────────────────────────

export const defindexUserBalanceSchema = z.object({
  dfTokens: z.string(),
  underlyingBalance: z.array(z.number()),
});
export type DefindexUserBalanceProps = z.infer<typeof defindexUserBalanceSchema>;

// ─── Transaction ───────────────────────────────────────────────

export const defindexTxContextSchema = z
  .object({
    vaultName: z.string().nullable().optional(),
    vaultSymbol: z.string().nullable().optional(),
    asset: z.string().nullable().optional(),
    assetAddress: z.string().nullable().optional(),
    apy: z.number().nullable().optional(),
    feesBps: z
      .object({
        vaultFee: z.number(),
        defindexFee: z.number(),
      })
      .nullable()
      .optional(),
  })
  .optional();

export const defindexTxCardSchema = z.object({
  operation: z.string(),
  xdr: z.string(),
  estimatedFee: z.string().optional(),
  vaultAddress: z.string().optional(),
  vaultName: z.string().optional(),
  asset: z.string().optional(),
  amounts: z.array(z.string()).optional(),
  from: z.string().optional(),
  apy: z.number().nullable().optional(),
  context: defindexTxContextSchema,
});
export type DefindexTxCardProps = z.infer<typeof defindexTxCardSchema>;

// ─── History ───────────────────────────────────────────────────

export const defindexVaultHistorySchema = z
  .object({
    vaultAddress: z.string(),
    period: z.string(),
    interval: z.string(),
    dataPoints: z.array(z.unknown()),
  })
  .passthrough();
export type DefindexVaultHistoryProps = z.infer<typeof defindexVaultHistorySchema>;

// ─── Account performance ───────────────────────────────────────

export const defindexAccountPerformanceSchema = z
  .object({
    accountAddress: z.string(),
    vaultAddress: z.string(),
    interval: z.string(),
    currentPosition: z
      .object({
        shares: z.string(),
        estimatedValue: z.string(),
        assets: z.array(z.unknown()),
      })
      .passthrough()
      .optional(),
    dataPoints: z.array(z.unknown()),
  })
  .passthrough();
export type DefindexAccountPerformanceProps = z.infer<typeof defindexAccountPerformanceSchema>;

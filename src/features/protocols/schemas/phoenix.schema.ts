import { z } from "zod";

// --- Pool token ------------------------------------------------

export const phoenixPoolTokenSchema = z.object({
  address: z.string(),
  symbol: z.string().optional(),
  /** Raw reserve amount held by the pool for this token, as returned by MCP. */
  amount: z.union([z.string(), z.number()]).nullable().optional(),
});
export type PhoenixPoolToken = z.infer<typeof phoenixPoolTokenSchema>;

// --- Pool ------------------------------------------------------

/**
 * Phoenix pools are AMM pairs, not Blend-style lending pools: they carry no
 * reserves and no lifecycle status, but they DO carry a second contract - the
 * stake contract - that users need in order to bond LP shares. Rendering them
 * through the Blend pool schema dropped `stakeAddress` and invented a
 * "unknown" status badge, so they get their own shape.
 */
export const phoenixPoolCardPropsSchema = z.object({
  address: z.string(),
  name: z.string(),
  /** Phoenix stake (farming) contract for this pair. Distinct from `address`. */
  stakeAddress: z.string().optional(),
  /** LP share token contract, returned by the single-pair resolve_pool shape. */
  lpShareAddress: z.string().optional(),
  /** Swap fee in basis points. MCP returns this as a string. */
  feeBps: z.number().nullable().optional(),
  tokens: z.array(phoenixPoolTokenSchema).optional(),
});
export type PhoenixPoolCardProps = z.infer<typeof phoenixPoolCardPropsSchema>;

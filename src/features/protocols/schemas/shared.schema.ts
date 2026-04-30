import { z } from "zod";

// ─── Swap / Bridge card ──────────────────────────────────────

export const swapBridgeCardPropsSchema = z.object({
  operation: z
    .enum(["swap", "bridge", "add_liquidity", "remove_liquidity"])
    .default("swap"),
  protocol: z.string(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
  amountOut: z.string(),
  fee: z.string().optional(),
  feeAmount: z.string().optional(),
  gasEstimate: z.string().optional(),
  estimatedTime: z.string().optional(),
  route: z.array(z.string()).optional(),
  xdr: z.string(),
  sourceChain: z.string().optional(),
  destChain: z.string().optional(),
  estimatedFee: z.string().optional(),
});

export type SwapBridgeCardProps = z.infer<typeof swapBridgeCardPropsSchema>;

/**
 * Adapters that normalize Phoenix MCP tool results into typed card props.
 *
 * `resolve_pool { protocol: "phoenix" }` has two shapes:
 *   - no token filter  -> { pools: [{ poolAddress, name, stakeAddress, feeBps }] }
 *   - tokenA + tokenB  -> { poolAddress, stakeAddress, tokenA, tokenB, lpShareAddress }
 * Both carry a `stakeAddress` that the Blend adapter had no field for and
 * therefore silently dropped.
 */

import type { PhoenixPoolCardProps, PhoenixPoolToken } from "../schemas/phoenix.schema";
import { phoenixPoolCardPropsSchema } from "../schemas/phoenix.schema";
import { unwrapMcpResult } from "./from-mcp";

function toStr(v: unknown): string | undefined {
  return v != null && v !== "" ? String(v) : undefined;
}

function toToken(v: unknown): PhoenixPoolToken | null {
  if (!v || typeof v !== "object") return null;
  const t = v as Record<string, unknown>;
  const address = toStr(t.address);
  if (!address) return null;
  return {
    address,
    symbol: toStr(t.symbol),
    amount: t.amount != null ? String(t.amount) : null,
  };
}

function labelFor(tokens: PhoenixPoolToken[], address: string): string {
  if (tokens.length) {
    return tokens.map((t) => t.symbol ?? `${t.address.slice(0, 8)}...`).join("/");
  }
  return address.slice(0, 10);
}

function normalizePhoenixPool(raw: Record<string, unknown>): PhoenixPoolCardProps | null {
  const address = toStr(raw.poolAddress) ?? toStr(raw.address) ?? toStr(raw.pool_address);
  if (!address) return null;

  const tokens = [toToken(raw.tokenA), toToken(raw.tokenB)].filter(
    (t): t is PhoenixPoolToken => t !== null
  );

  // MCP sends feeBps as a string ("50"); the SDK sends total_fee_bps as a number.
  const feeRaw = raw.feeBps ?? raw.totalFeeBps ?? raw.total_fee_bps;
  const feeNum = feeRaw != null ? Number(feeRaw) : Number.NaN;

  const result = phoenixPoolCardPropsSchema.safeParse({
    address,
    name: toStr(raw.name) ?? labelFor(tokens, address),
    stakeAddress: toStr(raw.stakeAddress) ?? toStr(raw.stake_address),
    lpShareAddress: toStr(raw.lpShareAddress) ?? toStr(raw.lp_share_address),
    feeBps: Number.isFinite(feeNum) ? feeNum : null,
    tokens: tokens.length ? tokens : undefined,
  });

  if (!result.success) {
    console.warn("[phoenix-from-mcp] pool normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

export function normalizePhoenixPoolsFromMcp(result: unknown): PhoenixPoolCardProps[] {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return [];

  const raw = data as Record<string, unknown>;
  const list: Record<string, unknown>[] = Array.isArray(raw.pools)
    ? (raw.pools as Record<string, unknown>[])
    : raw.poolAddress != null
      ? [raw]
      : [];

  return list
    .map((p) => normalizePhoenixPool(p))
    .filter((p): p is PhoenixPoolCardProps => p !== null);
}

/**
 * Adapters that normalize SDK API responses (from /api/protocols/defindex/*
 * and /api/defindex/*) into typed card props.
 */

import {
  type DefindexAccountPerformanceProps,
  type DefindexUserBalanceProps,
  type DefindexVaultCardProps,
  type DefindexVaultDetailProps,
  type DefindexVaultHistoryProps,
  defindexAccountPerformanceSchema,
  defindexUserBalanceSchema,
  defindexVaultCardSchema,
  defindexVaultDetailSchema,
  defindexVaultHistorySchema,
} from "../schemas/defindex.schema";

// --- Vaults list normalization -----------------------------------

/** First asset entry of the MCP vault shape: { address, symbol, totalRaw, ... }. */
function firstAsset(raw: Record<string, unknown>): Record<string, unknown> | null {
  const assets = raw.assets;
  if (!Array.isArray(assets) || assets.length === 0) return null;
  const a = assets[0];
  return a && typeof a === "object" ? (a as Record<string, unknown>) : null;
}

/**
 * The REST route returns `{ pools: [{ address, ... }] }` while MCP's
 * `resolve_pool { protocol: "defindex" }` returns `{ vaults: [{ vaultAddress,
 * assets: [...] }] }`. Reading only `pools`/`address` made every MCP vault
 * result normalize to an empty list, so the chat fell through to a card that
 * said "No pool data available" for a tool call that had succeeded.
 */
export function normalizeVaultsFromSdk(raw: Record<string, unknown>): DefindexVaultCardProps[] {
  const list = (raw.vaults ?? raw.pools ?? []) as Record<string, unknown>[];
  if (!Array.isArray(list)) return [];

  return list
    .map((p) => {
      const asset = firstAsset(p);
      const result = defindexVaultCardSchema.safeParse({
        ...p,
        address: p.address ?? p.vaultAddress,
        name: p.name ?? p.symbol ?? p.address ?? p.vaultAddress,
        asset: p.asset ?? asset?.symbol,
        assetAddress: p.assetAddress ?? asset?.address,
        // `totalRaw` is stroops, matching what the card divides by 1e7.
        tvl: p.tvl ?? (asset?.totalRaw as string | undefined),
      });
      if (!result.success) {
        console.warn("[defindex-from-sdk] vault normalization errors:", result.error.flatten());
        return null;
      }
      return result.data;
    })
    .filter((p): p is DefindexVaultCardProps => p !== null);
}

// --- Vault detail normalization ----------------------------------

export function normalizeVaultDetailFromSdk(
  raw: Record<string, unknown>
): DefindexVaultDetailProps | null {
  const data = (raw.vault ?? raw.pool ?? raw) as Record<string, unknown>;
  const result = defindexVaultDetailSchema.safeParse(data);
  if (!result.success) {
    console.warn("[defindex-from-sdk] vault detail errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// --- User balance normalization ----------------------------------

export function normalizeVaultBalanceFromSdk(
  raw: Record<string, unknown>
): DefindexUserBalanceProps | null {
  const data = (raw.balance ?? raw) as Record<string, unknown>;
  const result = defindexUserBalanceSchema.safeParse(data);
  if (!result.success) {
    console.warn("[defindex-from-sdk] balance errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// --- Vault history normalization ---------------------------------

export function normalizeVaultHistoryFromSdk(
  raw: Record<string, unknown>
): DefindexVaultHistoryProps | null {
  const data = (raw.history ?? raw) as Record<string, unknown>;
  const result = defindexVaultHistorySchema.safeParse(data);
  if (!result.success) {
    console.warn("[defindex-from-sdk] history errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// --- Account performance normalization ---------------------------

export function normalizeAccountPerformanceFromSdk(
  raw: Record<string, unknown>
): DefindexAccountPerformanceProps | null {
  const data = (raw.performance ?? raw) as Record<string, unknown>;
  const result = defindexAccountPerformanceSchema.safeParse(data);
  if (!result.success) {
    console.warn("[defindex-from-sdk] performance errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

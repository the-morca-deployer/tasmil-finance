/**
 * Adapters that normalize SDK API responses (from /api/protocols/defindex/*
 * and /api/defindex/*) into typed card props.
 */

import {
  type DefindexVaultCardProps,
  type DefindexVaultDetailProps,
  type DefindexUserBalanceProps,
  type DefindexVaultHistoryProps,
  type DefindexAccountPerformanceProps,
  defindexVaultCardSchema,
  defindexVaultDetailSchema,
  defindexUserBalanceSchema,
  defindexVaultHistorySchema,
  defindexAccountPerformanceSchema,
} from "../schemas/defindex.schema";

// ─── Vaults list normalization ───────────────────────────────────

export function normalizeVaultsFromSdk(raw: Record<string, unknown>): DefindexVaultCardProps[] {
  const pools = (raw.pools ?? []) as Record<string, unknown>[];
  return pools
    .map((p) => {
      const result = defindexVaultCardSchema.safeParse(p);
      if (!result.success) {
        console.warn("[defindex-from-sdk] vault normalization errors:", result.error.flatten());
        return null;
      }
      return result.data;
    })
    .filter((p): p is DefindexVaultCardProps => p !== null);
}

// ─── Vault detail normalization ──────────────────────────────────

export function normalizeVaultDetailFromSdk(raw: Record<string, unknown>): DefindexVaultDetailProps | null {
  const data = (raw.vault ?? raw.pool ?? raw) as Record<string, unknown>;
  const result = defindexVaultDetailSchema.safeParse(data);
  if (!result.success) {
    console.warn("[defindex-from-sdk] vault detail errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── User balance normalization ──────────────────────────────────

export function normalizeVaultBalanceFromSdk(raw: Record<string, unknown>): DefindexUserBalanceProps | null {
  const data = (raw.balance ?? raw) as Record<string, unknown>;
  const result = defindexUserBalanceSchema.safeParse(data);
  if (!result.success) {
    console.warn("[defindex-from-sdk] balance errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Vault history normalization ─────────────────────────────────

export function normalizeVaultHistoryFromSdk(raw: Record<string, unknown>): DefindexVaultHistoryProps | null {
  const data = (raw.history ?? raw) as Record<string, unknown>;
  const result = defindexVaultHistorySchema.safeParse(data);
  if (!result.success) {
    console.warn("[defindex-from-sdk] history errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Account performance normalization ───────────────────────────

export function normalizeAccountPerformanceFromSdk(raw: Record<string, unknown>): DefindexAccountPerformanceProps | null {
  const data = (raw.performance ?? raw) as Record<string, unknown>;
  const result = defindexAccountPerformanceSchema.safeParse(data);
  if (!result.success) {
    console.warn("[defindex-from-sdk] performance errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

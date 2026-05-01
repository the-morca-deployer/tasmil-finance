/**
 * Adapters that normalize DeFindex MCP tool results into typed card props.
 * MCP results are wrapped differently than SDK -- unwrap and delegate to SDK adapter.
 */

import type {
  DefindexVaultCardProps,
  DefindexVaultDetailProps,
  DefindexUserBalanceProps,
  DefindexTxCardProps,
} from "../schemas/defindex.schema";
import { unwrapMcpResult } from "./from-mcp";
import {
  normalizeVaultsFromSdk,
  normalizeVaultDetailFromSdk,
  normalizeVaultBalanceFromSdk,
} from "./defindex-from-sdk";

export function normalizeDefindexVaultsFromMcp(result: unknown): DefindexVaultCardProps[] {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return [];
  return normalizeVaultsFromSdk(data);
}

export function normalizeDefindexVaultDetailFromMcp(result: unknown): DefindexVaultDetailProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeVaultDetailFromSdk(data);
}

export function normalizeDefindexBalanceFromMcp(result: unknown): DefindexUserBalanceProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeVaultBalanceFromSdk(data);
}

export function normalizeDefindexYieldFromMcp(result: unknown): unknown[] {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return [];
  const raw = data as Record<string, unknown>;
  const opportunities = (raw.opportunities ?? raw.pools ?? raw.vaults ?? []) as unknown[];
  return Array.isArray(opportunities) ? opportunities : [];
}

export function normalizeDefindexTxFromMcp(
  result: unknown,
  args?: Record<string, unknown>,
): DefindexTxCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  const merged = { ...data, ...(args ?? {}) } as Record<string, unknown>;
  return {
    operation: String(merged.operation ?? ""),
    xdr: merged.xdr != null ? String(merged.xdr) : "",
    estimatedFee: merged.estimatedFee != null ? String(merged.estimatedFee) : undefined,
    vaultAddress: merged.vaultAddress != null ? String(merged.vaultAddress) : undefined,
    vaultName: merged.vaultName != null ? String(merged.vaultName) : undefined,
    asset: merged.asset != null ? String(merged.asset) : undefined,
    amounts: Array.isArray(merged.amounts) ? merged.amounts.map(String) : undefined,
    from: merged.from != null ? String(merged.from) : undefined,
    apy: merged.apy != null ? Number(merged.apy) : undefined,
    context: merged.context as DefindexTxCardProps["context"],
  };
}

/**
 * Adapters that normalize Aquarius MCP tool results into typed card props.
 * Handles the [{type:"text", text:"JSON"}] unwrapping pattern.
 */

import type {
  AquaPoolCardProps,
  AquaPositionsCardProps,
  AquaQuoteCardProps,
  AquaTxCardProps,
} from "../schemas/aquarius.schema";
import {
  normalizeAquaPoolFromSdk,
  normalizeAquaPoolsFromSdk,
  normalizeAquaPositionsFromSdk,
  normalizeAquaQuoteFromSdk,
  normalizeAquaTxFromSdk,
} from "./aquarius-from-sdk";
import { unwrapMcpResult } from "./from-mcp";

// ─── Pool ──────────────────────────────────────────────────────

export function normalizeAquaPoolFromMcp(result: unknown): AquaPoolCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeAquaPoolFromSdk(data);
}

export function normalizeAquaPoolsFromMcp(result: unknown): AquaPoolCardProps[] {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return [];
  return normalizeAquaPoolsFromSdk(data);
}

// ─── Quote ─────────────────────────────────────────────────────

export function normalizeAquaQuoteFromMcp(result: unknown): AquaQuoteCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeAquaQuoteFromSdk(data);
}

// ─── Positions ─────────────────────────────────────────────────

export function normalizeAquaPositionsFromMcp(result: unknown): AquaPositionsCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeAquaPositionsFromSdk(data);
}

// ─── Transaction ───────────────────────────────────────────────

export function normalizeAquaTxFromMcp(
  result: unknown,
  args?: Record<string, unknown>
): AquaTxCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  const merged = { ...data, ...(args ?? {}) } as Record<string, unknown>;
  return normalizeAquaTxFromSdk(merged);
}

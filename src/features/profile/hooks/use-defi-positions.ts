"use client";

import { usePosition } from "@/features/account/hooks/use-account-api";
import { useBlendPositions } from "./use-blend-positions";
import { useAquariusPositions } from "./use-aquarius-positions";
import { useWalletTokens, getCachedPrices } from "./use-wallet-tokens";

export interface PositionItem {
  name: string;
  type: "vault" | "supply" | "borrow" | "lp" | "stake";
  asset: string;
  valueUsd: number;
  apy?: number;
  allocationPercent?: number;
  extra?: string;
  /** LP pair info — if set, the UI shows two overlapping token icons */
  pair?: {
    token0: string;
    token1: string;
    pooled0?: string;
    pooled1?: string;
    shares?: string;
    sharePct?: string;
    poolType?: string;
    fee?: string;
    rewards?: string;
  };
}

export interface ProtocolPositionGroup {
  protocol: string;
  displayName: string;
  icon: string | null;
  totalValueUsd: number;
  positions: PositionItem[];
  pnl?: {
    profitUsd: number;
    profitPercent: number;
    currentApy: number;
  };
}

// ─── Tasmil vault positions (from backend) ────────────────────────────────────

/** Vault P&L data from the backend (managed accounts only). */
export interface VaultPnL {
  profitUsd: number;
  profitPercent: number;
  totalDepositedUsd: number;
  totalWithdrawnUsd: number;
  netDepositsUsd: number;
  currentApy: number;
}

function useTasmilGroup(publicKey: string | null | undefined) {
  const { data: pos, isLoading } = usePosition(publicKey ?? undefined);

  const group: ProtocolPositionGroup | null =
    pos && pos.positions.length > 0
      ? {
          protocol: "tasmil-vault",
          displayName: "Tasmil Vault",
          icon: null,
          totalValueUsd: pos.totalValueUsd,
          pnl: {
            profitUsd: pos.profitUsd,
            profitPercent: pos.profitPercent,
            currentApy: pos.currentApy,
          },
          positions: pos.positions.map((p) => {
            // Detect pair pools like "XLM/EURC"
            const parts = p.poolName.split("/");
            const isPair = parts.length === 2 && parts[0]!.length <= 10;
            return {
              name: p.poolName,
              type: "vault" as const,
              asset: isPair ? p.poolName : p.poolType,
              valueUsd: p.valueUsd,
              apy: p.apy,
              allocationPercent: p.allocationPercent,
              extra: `${p.allocationPercent.toFixed(1)}%`,
              ...(isPair && {
                pair: {
                  token0: parts[0]!.trim(),
                  token1: parts[1]!.trim(),
                },
              }),
            };
          }),
        }
      : null;

  // Extract vault P&L if available
  const vaultPnl: VaultPnL | null = pos
    ? {
        profitUsd: pos.profitUsd,
        profitPercent: pos.profitPercent,
        totalDepositedUsd: pos.totalDepositedUsd,
        totalWithdrawnUsd: pos.totalWithdrawnUsd,
        netDepositsUsd: pos.netDepositsUsd,
        currentApy: pos.currentApy,
      }
    : null;

  return { group, vaultPnl, isLoading };
}

// ─── Parse amount from "extra" field (e.g. "502.0011 XLM" → 502.0011) ────────

function parseAmount(extra?: string): number {
  if (!extra) return 0;
  const match = extra.match(/^[\d,.]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, "")) || 0;
}

// ─── Enrich positions with USD values from token prices ──────────────────────

function enrichWithPrices(
  groups: ProtocolPositionGroup[],
  priceMap: Record<string, number>,
): ProtocolPositionGroup[] {
  return groups.map((g) => {
    const positions = g.positions.map((pos) => {
      if (pos.valueUsd > 0) return pos; // already has value (e.g. Tasmil vault)

      let valueUsd = 0;

      if (pos.pair?.pooled0 && pos.pair?.pooled1) {
        // LP pair: value = pooled0 * price0 + pooled1 * price1
        const amt0 = parseFloat(pos.pair.pooled0.replace(/,/g, "")) || 0;
        const amt1 = parseFloat(pos.pair.pooled1.replace(/,/g, "")) || 0;
        const p0 = priceMap[pos.pair.token0.toUpperCase()] ?? 0;
        const p1 = priceMap[pos.pair.token1.toUpperCase()] ?? 0;
        valueUsd = amt0 * p0 + amt1 * p1;
      } else {
        // Single asset: value = amount * price
        const amount = parseAmount(pos.extra);
        const sym = pos.asset.toUpperCase();
        const price = priceMap[sym] ?? 0;
        valueUsd = amount * price;
      }

      return { ...pos, valueUsd };
    });

    const totalValueUsd =
      g.totalValueUsd > 0
        ? g.totalValueUsd
        : positions.reduce((s, p) => s + p.valueUsd, 0);

    return { ...g, positions, totalValueUsd };
  });
}

// ─── Combined hook ────────────────────────────────────────────────────────────

export function useDefiPositions(address: string | null | undefined) {
  const { group: tasmilGroup, vaultPnl, isLoading: tasmilLoading } = useTasmilGroup(address);
  const { data: blendGroups, isLoading: blendLoading } = useBlendPositions(address);
  const { data: aquaGroup, isLoading: aquaLoading } = useAquariusPositions(address);
  const { data: walletData } = useWalletTokens(address);

  // Build price map: CoinGecko cache first, then wallet token prices
  const priceMap: Record<string, number> = { ...getCachedPrices() };
  for (const t of walletData?.tokens ?? []) {
    if (t.price > 0) priceMap[t.assetCode.toUpperCase()] = t.price;
  }

  const rawGroups: ProtocolPositionGroup[] = [];
  if (tasmilGroup) rawGroups.push(tasmilGroup);
  if (blendGroups) rawGroups.push(...blendGroups);
  if (aquaGroup) rawGroups.push(aquaGroup);

  const groups = enrichWithPrices(rawGroups, priceMap);

  return {
    groups,
    vaultPnl,
    isLoading: tasmilLoading || blendLoading || aquaLoading,
    totalValueUsd: groups.reduce((s, g) => s + g.totalValueUsd, 0),
  };
}

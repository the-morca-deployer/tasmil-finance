export interface RebalanceStatus {
  ready: boolean;
  halted: boolean;
  haltReason: string | null;
}

export interface DiscoveredPool {
  id: string;
  /** UPPER-CASE on the wire ("BLEND"), mirroring `enum Protocol` in the
   *  backend's Prisma schema. Same field, same correction as
   *  `features/farming/types.ts`. */
  protocol: "BLEND" | "SOROSWAP" | "AQUARIUS" | "SDEX";
  poolType: "lending" | "backstop" | "lp";
  poolAddress: string;
  strategyContractAddress?: string;
  asset: string;
  assetSymbol: string;
  pairedAsset?: string;
  pairedAssetSymbol?: string;
  currentApy: number;
  tvlUsd: number;
  volume7d?: number;
  q4wPercent?: number;
  riskScore: number;
  enabled: boolean;
  lastUpdated: string;
}

export interface ApySnapshot {
  poolId: string;
  apy: number;
  tvlUsd: number;
  timestamp: string;
}

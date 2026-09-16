export interface RebalanceStatus {
  ready: boolean;
  halted: boolean;
  haltReason: string | null;
}

export interface DiscoveredPool {
  id: string;
  /**
   * UPPER-CASE, mirroring `enum Protocol` in the backend's Prisma schema -
   * `GET /api/pools` serialises the enum member verbatim, so the wire value is
   * `"BLEND"`, never `"blend"`. This field was typed lower-case for a long
   * time, which meant every `pool.protocol === "blend"` comparison written
   * against the type was dead code. Compare case-insensitively when matching
   * against anything that isn't this same field.
   */
  protocol: "BLEND" | "SOROSWAP" | "AQUARIUS" | "SDEX";
  /** Lower-case on the wire, unlike `protocol` - the backend maps `PoolType`
   *  down before serialising. Verified against `GET /api/pools`. */
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

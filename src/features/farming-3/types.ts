/**
 * Types for the `/farming-3` console.
 *
 * These mirror the backend response shapes 1:1 but are declared locally so
 * `farming-3` stays self-contained (feature-isolation rule: no imports from
 * `farming`, `farming-2`, or any other feature's `types.ts`).
 *
 * UNIT CONVENTION - read this before touching any APY code path:
 * every `apy` / `currentApy` field below is a DECIMAL FRACTION. The backend
 * returns `0.067065` for a 6.7065% rate. Multiply by 100 exactly once, at the
 * formatting boundary (`formatApy` in `utils/format.ts`). A previous version of
 * `apr-summary-card.tsx` skipped the multiply and rendered every rate 100x too
 * small; that is the bug these comments exist to prevent.
 */

export type AccountStatus = "DEPLOYING" | "AWAITING_FUND" | "ACTIVE" | "HALTED" | "REVOKED";

export type RiskPreset = "Safe" | "Balanced" | "Aggressive";

export type DepositToken = "USDC" | "XLM";

/** One strategy leg inside `GET /api/account/position/:publicKey`. */
export interface ConsolePositionLeg {
  poolName: string;
  poolType: string;
  protocol: string;
  allocationPercent: number;
  valueUsd: number;
  /** DECIMAL FRACTION. `0.067065` = 6.7065%. */
  apy: number;
  q4wExpiresAt?: string;
}

/** `GET /api/account/position/:publicKey` → `data`. */
export interface ConsolePosition {
  totalValueUsd: number;
  totalDepositedUsd: number;
  totalWithdrawnUsd: number;
  netDepositsUsd: number;
  profitUsd: number;
  profitPercent: number;
  /** DECIMAL FRACTION. `0.07` = 7.00%. */
  currentApy: number;
  preset: string;
  status: AccountStatus;
  baseAsset?: string;
  activeAssets?: string[];
  positions: ConsolePositionLeg[];
  gasReserveUsd: number;
  balanceStale?: boolean;
  sessionKeyStale?: boolean;
  createdAt: string;
  keeperWalletAddress: string;
}

/** One row of `GET /api/pools` → `data`. */
export interface ConsolePool {
  id: string;
  /** Backend returns this upper-cased ("BLEND"). Compare case-insensitively. */
  protocol: string;
  poolType: string;
  poolAddress: string;
  strategyContractAddress?: string;
  asset: string;
  assetSymbol: string;
  /** DECIMAL FRACTION. `0.06706519` = 6.71%. */
  currentApy: number;
  tvlUsd: number;
  riskScore: number;
  enabled: boolean;
  lastUpdated: string;
}

/** `GET /api/rebalance/status` → `data`. */
export interface ConsoleRebalanceStatus {
  ready: boolean;
  halted: boolean;
  haltReason: string | null;
}

/** One row of `GET /api/account/activity/:publicKey` → `data.items`. */
export interface ConsoleActivityItem {
  id: string;
  type: string;
  category: string;
  amount?: number;
  amountUsd?: number;
  token?: string;
  detail?: string;
  txHash?: string;
  pool?: { protocol: string; name: string; assetSymbol: string };
  createdAt: string;
}

/* ── signing journey ──────────────────────────────────────────────────────── */

/**
 * The signing chain, as it actually runs on mainnet today.
 *
 * Three steps, not two: the pinned mainnet keeper-wallet WASM exposes
 * `__constructor(owner, owner_pubkey)` with no room for session config, so
 * deploy and session-key registration cannot share one signature. The
 * six-parameter build that collapses them exists on testnet only.
 *
 * The step LIST is data (`JOURNEY_STEPS` in `utils/journey.ts`) precisely so
 * that collapsing to two steps later is a config edit, not a rewrite.
 */
export type JourneyStepId = "deploy" | "configure_session_key" | "fund";

/** What a step looks like to the user right now. */
export type JourneyStepState = "pending" | "signing" | "confirmed" | "failed";

/** Where inside the active step we are. `signing` covers the wallet prompt. */
export type JourneyPhase = "idle" | "building" | "signing" | "submitting" | "confirmed" | "failed";

export interface JourneyStepConfig {
  id: JourneyStepId;
  title: string;
  /** One line naming what is being signed and why. */
  detail: string;
}

/** The machine's whole state. Serialisable, no React in it. */
export interface JourneyProgress {
  /** Steps known to have landed on-chain. Only ever flips false → true. */
  confirmed: Partial<Record<JourneyStepId, true>>;
  /** Hash per step, recorded as soon as it is known - which may be before the
   *  step is confirmed. Absent means "not known", never "none". */
  txHashes: Partial<Record<JourneyStepId, string>>;
  /** The step currently being driven, or null when nothing is in flight. */
  activeStepId: JourneyStepId | null;
  phase: JourneyPhase;
  error: string | null;
}

/** A step ready to render: config + resolved state + resolved links. */
export interface JourneyStepView extends JourneyStepConfig {
  /** 0-based position in the configured list. */
  index: number;
  state: JourneyStepState;
  /** True for the one step the user should be looking at. */
  isCurrent: boolean;
  /** `null` means "no hash known", which is NOT the same as "no transaction". */
  txHash: string | null;
  explorerUrl: string | null;
}

export type JourneyEvent =
  /** Seed completion from an authoritative server read. Never un-confirms. */
  | { type: "seed"; confirmed: Partial<Record<JourneyStepId, true>> }
  | { type: "start"; stepId: JourneyStepId }
  | { type: "phase"; phase: JourneyPhase }
  | { type: "tx"; stepId: JourneyStepId; hash: string }
  | { type: "confirm"; stepId: JourneyStepId; hash?: string }
  | { type: "fail"; message: string }
  | { type: "clearError" }
  | { type: "reset" };

/* ── flow ─────────────────────────────────────────────────────────────────── */

/** The console's four screens, in the order the flow visits them. */
export type ConsoleStage = "strategy" | "deposit" | "journey" | "dashboard";

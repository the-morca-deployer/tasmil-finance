"use client";

/**
 * The console's ONLY read-data module.
 *
 * No new API client is created here and no new endpoint is called: every hook
 * below wraps a Kubb-generated hook from `@/gen-backend/hooks` (shared, not a
 * feature) with the same `select` unwrap and cadence the rest of the app uses.
 * They are re-declared here rather than imported from `@/features/farming` so
 * `farming-3` keeps the feature isolation the design doc asks for.
 *
 * Writes live in `@/shared/hooks/use-account-mutations` — shared code, imported
 * directly by `use-signing-journey`. This file used to re-export them out of
 * `@/features/account`, which was a cross-feature import in all but name.
 */

import {
  useAccountControllerGetActivity,
  useAccountControllerGetPosition,
  usePoolsControllerGetPools,
  usePortfolioControllerGetHistory,
  useRebalanceControllerGetStatus,
} from "@/gen-backend/hooks";
import { $b, $bLive } from "@/lib/kubb-backend";
import type {
  ConsoleActivityItem,
  ConsolePool,
  ConsolePosition,
  ConsoleRebalanceStatus,
  ConsoleSnapshot,
  RiskPreset,
} from "../types";

/** The console spells presets `"Balanced"`; the API takes `"BALANCED"`. */
const PRESET_PARAM: Record<RiskPreset, "SAFE" | "BALANCED" | "AGGRESSIVE"> = {
  Safe: "SAFE",
  Balanced: "BALANCED",
  Aggressive: "AGGRESSIVE",
};

/**
 * `GET /api/pools`. `currentApy` on every row is a decimal fraction.
 *
 * Passing `riskPreset` (with `baseAsset`) switches the backend from "every pool
 * with a deployed strategy" to "the pools this preset is allowed to touch" —
 * the server's own `getFilteredPools`, i.e. the risk/TVL/asset gate the
 * allocation engine applies before it weights anything. That is what makes the
 * preset choice legible without inventing a per-pool control the API cannot
 * honour.
 */
export function useConsolePools(baseAsset?: string, riskPreset?: RiskPreset) {
  return usePoolsControllerGetPools(
    { baseAsset, riskPreset: riskPreset ? PRESET_PARAM[riskPreset] : undefined },
    {
      query: {
        ...$b.query,
        refetchInterval: 60_000,
        retry: 2,
        // `data` absent means the envelope was malformed - surface an empty
        // list, and let the caller tell "loading" apart via `isLoading`.
        select: (res: unknown): ConsolePool[] => (res as { data?: ConsolePool[] }).data ?? [],
      },
    }
  );
}

/**
 * The server's stored preset (`"BALANCED"`) as the console's spelling.
 *
 * `undefined` for anything unrecognised — including an absent value. Defaulting
 * an unknown preset to `"Balanced"` would put a label on the screen that the
 * account does not carry.
 */
export function riskPresetFromServer(value: string | null | undefined): RiskPreset | undefined {
  switch (value?.toUpperCase()) {
    case "SAFE":
      return "Safe";
    case "BALANCED":
      return "Balanced";
    case "AGGRESSIVE":
      return "Aggressive";
    default:
      return undefined;
  }
}

/** What one preset would be allowed to allocate into, per the server. */
export interface PresetCandidates {
  pools: ConsolePool[] | undefined;
  isLoading: boolean;
  error: unknown;
}

/**
 * The candidate set for every preset at once, so the three choices can be
 * compared with the server's own answer rather than a rule restated in the UI.
 *
 * Three fixed queries — the hook order never varies — against one 60-second
 * cache. This is what makes the preset control honest: the backend has no
 * endpoint that accepts a hand-picked venue list, so instead of offering a
 * per-pool control the agent would ignore, each preset shows the set it can
 * actually draw from.
 *
 * Note what this is NOT: the final allocation. The server filter here is
 * risk-ceiling + TVL floor + asset compatibility + "a strategy is deployed".
 * The engine then scores that set and keeps only its top `maxPools`. The UI must
 * say "can pick from", never "will hold".
 */
export function useConsolePresetCandidates(
  baseAsset: string
): Record<RiskPreset, PresetCandidates> {
  const safe = useConsolePools(baseAsset, "Safe");
  const balanced = useConsolePools(baseAsset, "Balanced");
  const aggressive = useConsolePools(baseAsset, "Aggressive");
  return {
    Safe: { pools: safe.data, isLoading: safe.isLoading, error: safe.error },
    Balanced: { pools: balanced.data, isLoading: balanced.isLoading, error: balanced.error },
    Aggressive: {
      pools: aggressive.data,
      isLoading: aggressive.isLoading,
      error: aggressive.error,
    },
  };
}

/**
 * `GET /api/account/position/:publicKey`.
 *
 * Returns `null` (not a zeroed object) when the wallet has no managed account,
 * so the UI can say "no account yet" instead of "$0.00".
 */
export function useConsolePosition(publicKey: string | undefined) {
  return useAccountControllerGetPosition(publicKey as string, {
    query: {
      ...$bLive.query,
      enabled: !!publicKey,
      staleTime: 30_000,
      select: (res: unknown): ConsolePosition | null =>
        (res as { data?: ConsolePosition }).data ?? null,
    },
  });
}

/** `GET /api/rebalance/status` — is the allocation engine able to act. */
export function useConsoleRebalanceStatus() {
  return useRebalanceControllerGetStatus({
    query: {
      ...$bLive.query,
      refetchInterval: 15_000,
      retry: 2,
      select: (res: unknown): ConsoleRebalanceStatus | null =>
        (res as { data?: ConsoleRebalanceStatus }).data ?? null,
    },
  });
}

/**
 * `GET /api/portfolio/history/:address?days=N` — the value series behind the
 * performance chart. Keyed by the KEEPER contract address (`C…`), which is where
 * the snapshot job records; passing the user's `G…` wallet returns an empty
 * series, which is a real answer and not an error.
 *
 * `select` returns `null`, not `[]`, when the envelope is not a series. An
 * unreadable history and a genuinely empty one are different claims and the
 * chart renders them differently. Errors are left to propagate — the previous
 * implementation in `features/farming` swallowed every non-2xx into `[]`, which
 * made "the request failed" look like "you have no history".
 */
export function useConsoleHistory(keeperAddress: string | undefined, days = 30) {
  return usePortfolioControllerGetHistory(
    keeperAddress as string,
    { days },
    {
      query: {
        ...$b.query,
        enabled: !!keeperAddress,
        refetchInterval: 300_000,
        retry: 1,
        select: (res: unknown): ConsoleSnapshot[] | null => {
          const body = (res as { data?: unknown }).data;
          if (Array.isArray(body)) return body as ConsoleSnapshot[];
          return Array.isArray(res) ? (res as ConsoleSnapshot[]) : null;
        },
      },
    }
  );
}

/** `GET /api/account/activity/:publicKey`. Also the source the journey reads
 *  its historical tx hashes back from. */
export function useConsoleActivity(publicKey: string | undefined) {
  return useAccountControllerGetActivity(
    publicKey as string,
    { limit: "50" },
    {
      query: {
        ...$b.query,
        enabled: !!publicKey,
        refetchInterval: 60_000,
        select: (res: unknown): ConsoleActivityItem[] =>
          (res as { data?: { items?: ConsoleActivityItem[] } }).data?.items ?? [],
      },
    }
  );
}

"use client";

/**
 * The console's ONLY data-access module.
 *
 * No new API client is created here and no new endpoint is called. Everything
 * below is one of two things:
 *
 *  - a query wrapper over the Kubb-generated hooks in `@/gen-backend/hooks`
 *    (shared, not a feature) with the same `select` unwrap and cadence the rest
 *    of the app uses. This is the `usePools` / `usePosition` /
 *    `useRebalanceStatus` / `useActivity` layer, re-declared here rather than
 *    imported from `@/features/farming` so `farming-3` keeps the feature
 *    isolation the design doc asks for.
 *
 *  - a re-export of the account feature's existing mutation hooks. Those wrap
 *    `backendAxios` and there is no shared equivalent; re-implementing them
 *    would mean writing a second API client, which the brief forbids outright.
 *    This is the single place `farming-3` reaches into another feature, and it
 *    is the same dependency `farming` and `farming-2` already carry.
 *
 * Every component in `farming-3` imports from here and nowhere else.
 */

import {
  useAccountControllerGetActivity,
  useAccountControllerGetPosition,
  usePoolsControllerGetPools,
  useRebalanceControllerGetStatus,
} from "@/gen-backend/hooks";
import { $b, $bLive } from "@/lib/kubb-backend";
import type {
  ConsoleActivityItem,
  ConsolePool,
  ConsolePosition,
  ConsoleRebalanceStatus,
} from "../types";

export {
  useDeployAccount,
  useFundAccount,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
  useWithdraw,
} from "@/features/account/hooks/use-account-api";

/** `GET /api/pools`. `currentApy` on every row is a decimal fraction. */
export function useConsolePools(baseAsset?: string) {
  return usePoolsControllerGetPools(
    { baseAsset },
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

"use client";

/**
 * Keeper-account write operations — the one home for them.
 *
 * These mutations wrap `backendAxios` against `/api/account/*`. Kubb generates
 * query hooks but no mutation hooks, so this file is hand-written; it used to
 * live inside `features/account`, which meant `farming`, `farming-2` and
 * `farming-3` all reached across a feature boundary to call it. Nothing here is
 * account-screen-specific, so it belongs in `shared/` and the features import
 * it from here.
 *
 * Read hooks are NOT here: those are generated (`@/gen-backend/hooks`) and each
 * feature wraps them with its own `select` shape.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import backendAxios from "@/lib/kubb-backend";

/**
 * Pull the backend's own message out of an axios error.
 *
 * Without this the caller sees "Request failed with status code 400" instead of
 * the reason the server actually gave ("txInsufficientFee", "Withdraw
 * temporarily blocked by keeper cooldown", …). Returns `null` when the response
 * carried no message, so the original error can be rethrown untouched rather
 * than replaced by an invented one.
 */
function backendMessage(err: unknown): string | null {
  const detail = (err as { response?: { data?: { message?: string | string[] } } }).response?.data
    ?.message;
  const text = Array.isArray(detail) ? detail.join("; ") : detail;
  return text && text.length > 0 ? text : null;
}

function rethrowWithBackendMessage(err: unknown): never {
  const text = backendMessage(err);
  if (text) throw new Error(text);
  throw err;
}

/** Account-scoped caches that any write invalidates. Matches both the Kubb
 *  query keys (`…getPosition…`) and the hand-rolled string keys. */
function isAccountScopedKey(key: unknown): boolean {
  return (
    typeof key === "string" &&
    (key.includes("getPosition") ||
      key.includes("getActivity") ||
      key === "/api/account/me" ||
      key === "/api/account/position" ||
      key === "/api/account/activity")
  );
}

// --- deploy / setup -------------------------------------------------------

export interface DeployAccountResponse {
  /** Unsigned XDR for the user to sign. Absent when `alreadyDeployed` is true. */
  xdr?: string;
  keeperWalletAddress: string;
  /** True when the server short-circuited because an account already exists
   *  for this pubkey. Caller should skip signing and continue with setup. */
  alreadyDeployed?: boolean;
  /** Account status when alreadyDeployed is true: DEPLOYING / AWAITING_FUND / ... */
  status?: string;
}

export interface DeployAccountArgs {
  publicKey: string;
  /** Opt in to destructive cleanup of an existing DEPLOYING / unfunded
   *  AWAITING_FUND row. Used by the "Reset deployment" recovery path. */
  recover?: boolean;
}

export function useDeployAccount() {
  return useMutation({
    mutationFn: async (args: DeployAccountArgs | string) => {
      const body = typeof args === "string" ? { publicKey: args } : args;
      const { data } = await backendAxios.post<{ data: DeployAccountResponse }>(
        "/api/account/deploy",
        body
      );
      return data.data;
    },
  });
}

export function useSetupAccount() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { setupTxs: string[] } }>(
        "/api/account/setup",
        { publicKey }
      );
      return data.data;
    },
  });
}

export function useResumeAccount() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { status: string } }>(
        `/api/account/resume/${publicKey}`
      );
      return data.data;
    },
  });
}

// --- funding / withdrawal -------------------------------------------------

export function useFundAccount() {
  return useMutation({
    mutationFn: async (dto: { publicKey: string; amount: number; token: string }) => {
      const { data } = await backendAxios.post<{ data: { xdr: string } }>("/api/account/fund", dto);
      return data.data;
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { publicKey: string; amount: number }) => {
      try {
        const { data } = await backendAxios.post<{
          data: {
            xdr?: string;
            xdrs?: string[];
            signedXdrs?: string[];
            // Server-side bot-signed submissions: hashes of TXs already
            // confirmed on-chain. No client-side submit needed for these.
            submittedTxHashes?: string[];
          };
        }>("/api/account/withdraw", dto);
        return data.data;
      } catch (err: unknown) {
        // e.g. "Insufficient withdrawable balance. Unfilled amount: $4.19".
        return rethrowWithBackendMessage(err);
      }
    },
    // Withdraw outcome (success OR failure from a stale cache hit) means our
    // cached position/balance is suspect - invalidate so the dashboard
    // refetches actual on-chain state on next render.
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (q) => isAccountScopedKey(q.queryKey?.[0]),
      });
    },
  });
}

// --- strategy / session key ----------------------------------------------

export function useUpdatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ publicKey, preset }: { publicKey: string; preset: string }) => {
      const { data } = await backendAxios.put<{ data: unknown }>(
        `/api/account/preset/${publicKey}`,
        { preset }
      );
      return data.data;
    },
    // Refresh position so the dashboard shows the new preset + allocation
    // pipeline picks it up on the next rebalance cycle.
    onSuccess: () => {
      qc.invalidateQueries({ predicate: (q) => isAccountScopedKey(q.queryKey[0]) });
    },
  });
}

export function useRevoke() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { xdr: string } }>("/api/account/revoke", {
        publicKey,
      });
      return data.data;
    },
  });
}

export function useReactivate() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { setupTxs: string[] } }>(
        "/api/account/reactivate",
        { publicKey }
      );
      return data.data;
    },
  });
}

// --- submission -----------------------------------------------------------

export interface SubmitTxParams {
  signedXdr: string;
  publicKey?: string;
  txType?: "deploy" | "setup" | "fund" | "withdraw" | "revoke" | "reactivate";
  amount?: number;
  token?: string;
}

export function useSubmitTx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: SubmitTxParams) => {
      try {
        const { data } = await backendAxios.post<{ data: unknown }>("/api/account/submit", params);
        return data.data;
      } catch (err: unknown) {
        // e.g. "txInsufficientFee", "Transaction rejected due to sequence
        // number collision".
        return rethrowWithBackendMessage(err);
      }
    },
    // Invalidate account-scoped queries so the UI immediately reflects the new
    // account state (e.g. DEPLOYING → AWAITING_FUND after setup confirms).
    // Without this, React Query serves stale cached data until the next poll.
    onSuccess: () => {
      qc.invalidateQueries({ predicate: (q) => isAccountScopedKey(q.queryKey[0]) });
    },
  });
}

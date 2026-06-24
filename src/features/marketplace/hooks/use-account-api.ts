"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6756";

export interface TradingAccount {
  exists: boolean;
  keeperWalletAddress: string | null;
  status: string | null;
}

async function fetchTradingAccount(): Promise<TradingAccount> {
  const res = await fetch(`${BASE_URL}/api/account/trading-account`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("tasmil_auth_token") ?? ""}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch trading account");
  const json = await res.json();
  return json.data ?? json;
}

export function useTradingAccount() {
  return useQuery({
    queryKey: ["trading-account"],
    queryFn: fetchTradingAccount,
    refetchInterval: 30_000,
  });
}

export function useDeployTradingAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetch(`${BASE_URL}/api/account/deploy-trading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tasmil_auth_token") ?? ""}`,
        },
        credentials: "include",
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to deploy trading account");
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading-account"] }),
  });
}

export function useSetupTradingAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (strategyContract: string) =>
      fetch(`${BASE_URL}/api/account/setup-trading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tasmil_auth_token") ?? ""}`,
        },
        credentials: "include",
        body: JSON.stringify({ strategyContract }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to setup trading account");
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading-account"] }),
  });
}

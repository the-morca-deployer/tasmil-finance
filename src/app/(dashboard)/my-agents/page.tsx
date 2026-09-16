"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Power, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

// Same-origin: the /api/marketplace rewrite in next.config proxies to the backend and
// carries the caller's credentials. Hitting the backend URL directly skips that and 401s.
async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  }
  const body = await res.json();
  return body.data as T;
}

interface MyAgent {
  keeperWalletAddress: string;
  baseAsset: string;
  status: string;
  activeStrategy: {
    strategyId: string;
    name: string;
    publisherName: string;
    currentApy: number;
    totalDepositedUsd: number;
    activatedAt: string;
  } | null;
}

function fetchMyAgents(): Promise<{ vaults: MyAgent[] }> {
  return apiJson<{ vaults: MyAgent[] }>("/api/marketplace/my-strategies");
}

export default function MyAgentsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-agents"],
    queryFn: fetchMyAgents,
    refetchInterval: 30000,
  });

  const deactivate = useMutation({
    mutationFn: (strategyId: string) =>
      apiJson(`/api/marketplace/strategies/${strategyId}/deactivate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-agents"] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="mt-4 text-red-400 text-sm">Failed to load your agents</p>
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const vaults = data?.vaults ?? [];

  if (vaults.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <Shield className="mx-auto h-12 w-12 text-white/20" />
        <h1 className="mt-4 font-bold text-white text-xl">My Agents</h1>
        <p className="mt-2 text-sm text-white/40">No vaults found. Deploy a vault first.</p>
        <Button className="mt-6" onClick={() => window.location.assign("/marketplace")}>
          Browse Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-bold text-2xl text-white">My Agents</h1>
      <div className="space-y-4">
        {vaults.map((vault) => (
          <Card key={vault.keeperWalletAddress} className="border-white/5 bg-white/3 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="font-semibold text-sm text-white">{vault.baseAsset} Vault</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      vault.status === "ACTIVE"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {vault.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-white/40 text-xs">
                  {vault.keeperWalletAddress.slice(0, 12)}...
                </p>
              </div>
            </div>

            {vault.activeStrategy ? (
              <div className="mt-4 rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-white">{vault.activeStrategy.name}</p>
                    <p className="text-white/40 text-xs">by {vault.activeStrategy.publisherName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-sm">
                      {vault.activeStrategy.currentApy.toFixed(1)}% APY
                    </p>
                    <p className="text-white/30 text-xs">
                      Activated {new Date(vault.activeStrategy.activatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 h-7 gap-1.5 border-red-900/50 text-red-400 text-xs"
                  // biome-ignore lint/style/noNonNullAssertion: guarded by truthy check above
                  onClick={() => deactivate.mutate(vault.activeStrategy!.strategyId)}
                  disabled={deactivate.isPending}
                >
                  <Power className="h-3 w-3" /> Deactivate
                </Button>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-white/30">No active strategy</p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.assign("/marketplace")}
                >
                  Browse Strategies
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

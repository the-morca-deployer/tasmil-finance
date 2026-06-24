"use client";

import { ArrowUpRight, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { StrategyDetail } from "@/features/marketplace";
import {
  useDeployTradingAccount,
  useSetupTradingAccount,
  useTradingAccount,
} from "@/features/marketplace/hooks/use-account-api";
import {
  useActivateStrategyConfirm,
  useActivateStrategyRequest,
  useMyAgents,
  useStrategyDetail,
  useStrategyPerformance,
} from "@/features/marketplace/hooks/use-marketplace-api";
import { Button } from "@/shared/ui/button";

export default function StrategyDetailRoute() {
  const params = useParams();
  const router = useRouter();
  const id = params.strategyId as string;

  const { data: strategy, isLoading, error } = useStrategyDetail(id);
  const { data: performance, isLoading: perfLoading } = useStrategyPerformance(id);
  const { data: tradingAccount, isLoading: tradingLoading } = useTradingAccount();
  const { data: myAgents } = useMyAgents();
  const deployTrading = useDeployTradingAccount();
  const setupTrading = useSetupTradingAccount();
  const activateRequest = useActivateStrategyRequest();
  const activateConfirm = useActivateStrategyConfirm();

  // Derive whether the current strategy is activated by this user
  const activatedByUser = useMemo(
    () =>
      myAgents?.some(
        (agent) => agent.purpose === "TRADING" && agent.activeStrategy?.strategyId === id
      ) ?? false,
    [myAgents, id]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (error || !strategy) {
    return <div className="py-24 text-center text-red-400 text-sm">Strategy not found</div>;
  }

  const renderAction = (
    <>
      {/* Trading Account Setup & Activation Flow */}
      {!tradingLoading && !tradingAccount?.exists && (
        <Button
          className="w-full gap-2"
          onClick={() => deployTrading.mutate()}
          disabled={deployTrading.isPending}
        >
          {deployTrading.isPending ? "Deploying..." : "Deploy Trading Account"}
        </Button>
      )}

      {!tradingLoading && tradingAccount?.exists && tradingAccount.status === "DEPLOYING" && (
        <Button
          className="w-full gap-2"
          onClick={() => setupTrading.mutate(strategy.contractAddress)}
          disabled={setupTrading.isPending}
        >
          {setupTrading.isPending ? "Setting up..." : "Setup Trading Account"}
        </Button>
      )}

      {!tradingLoading &&
        tradingAccount?.exists &&
        tradingAccount.status === "ACTIVE" &&
        !activatedByUser && (
          <Button
            className="w-full gap-2"
            onClick={async () => {
              try {
                const result = await activateRequest.mutateAsync({
                  strategyId: id,
                  keeperWalletAddress: tradingAccount.keeperWalletAddress!,
                });
                // User signs in wallet — for now, prompt with the XDR
                // In production, this would use Reown/AppKit or Freighter
                const signedTxHash = window.prompt(
                  `Sign this transaction:\n\n${JSON.stringify(result, null, 2)}\n\nPaste signed transaction hash:`
                );
                if (signedTxHash) {
                  await activateConfirm.mutateAsync({
                    strategyId: id,
                    txHash: signedTxHash,
                    keeperWalletAddress: tradingAccount.keeperWalletAddress!,
                  });
                }
              } catch (err) {
                console.error("Activation failed", err);
              }
            }}
            disabled={activateRequest.isPending || activateConfirm.isPending || strategy.paused}
          >
            {activateRequest.isPending || activateConfirm.isPending
              ? "Activating..."
              : strategy.paused
                ? "Strategy Paused"
                : "Activate Strategy"}
            {!strategy.paused && !activateRequest.isPending && !activateConfirm.isPending && (
              <ArrowUpRight className="h-4 w-4" />
            )}
          </Button>
        )}

      {tradingAccount?.exists && activatedByUser && (
        <span className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500/10 py-3 text-sm font-medium text-emerald-400">
          Strategy Active
        </span>
      )}
    </>
  );

  return (
    <StrategyDetail
      strategy={strategy}
      performance={performance ?? []}
      loading={perfLoading}
      renderAction={renderAction}
      onBack={() => router.push("/marketplace")}
    />
  );
}

"use client";

import { motion } from "framer-motion";
import { Loader2, Wallet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useActivity, usePosition } from "@/features/account/hooks/use-account-api";
import { isNotFoundError } from "@/lib/query-error";
import { Button } from "@/shared/ui/button";
import { useWalletHydrated, useWalletStore } from "@/store/use-wallet";
import { useFarmingActions } from "../hooks/use-farming-actions";
import { usePools } from "../hooks/use-farming-api";
import { usePositionHistory } from "../hooks/use-position-history";
import type { DiscoveredPool } from "../types";
import { ActivityDrawer } from "./activity-drawer";
import type { AgentHistoryEvent } from "./dashboard/agent-history-card";
import { ACTIVITY_LABEL } from "./farming-activity";
import { FarmingDashboard } from "./farming-dashboard";
import { FarmingModals, type FarmingModalTab } from "./farming-modals";
import { PoolDetailDrawer } from "./pool-detail-drawer";

/**
 * Empty state shown to a connected user who has no Position yet (or whose
 * deploy is still in flight). Click the gradient CTA → routes to the
 * dedicated /farming/setup full-page wizard.
 */
function GetStartedEmptyState({ resuming, onStart }: { resuming: boolean; onStart: () => void }) {
  return (
    <motion.div
      className="mx-auto flex max-w-lg flex-col items-center py-24 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
        <Wallet className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mb-2 font-bold text-2xl text-foreground">
        {resuming ? "Resume your setup" : "Set up your farming account"}
      </h2>
      <p className="mb-6 max-w-md text-muted-foreground text-sm">
        {resuming
          ? "Your previous setup didn't finish. Pick up where you left off - your selections are saved."
          : "Choose the asset and strategy your agent will use. Two wallet signatures, ~30 seconds."}
      </p>
      <Button
        variant="gradient"
        size="lg"
        data-testid="setup-cta"
        className="h-11 px-8"
        onClick={onStart}
      >
        {resuming ? "Resume setup" : "Get started"}
      </Button>
    </motion.div>
  );
}

function FarmingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account } = useWalletStore();
  const walletHydrated = useWalletHydrated();
  const publicKey = account ?? undefined;

  const tabParam = searchParams.get("tab");

  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [poolDrawer, setPoolDrawer] = useState<DiscoveredPool | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: open drawer once on mount when ?tab=activity
  useEffect(() => {
    if (tabParam === "activity") setActivityDrawerOpen(true);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<FarmingModalTab>("fund");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const {
    data: position,
    isPending: positionPending,
    isSuccess: positionLoaded,
    isError: positionFailed,
    error: positionError,
    refetch: refetchPosition,
  } = usePosition(publicKey);

  // `GET /api/account/position/:publicKey` answers 404 for a wallet with no
  // managed account, so "no account" arrives as an error like any other. Only
  // that one status means it; the rest mean the read failed.
  const noManagedAccount =
    (positionFailed && isNotFoundError(positionError)) || (positionLoaded && !position);
  const positionUnreadable = positionFailed && !isNotFoundError(positionError);

  // Redirect any user without an active managed account to /farming/setup.
  // Disconnected users land on Step 1 (Connect). Connected-but-no-account
  // users land on Step 2 - but ONLY once we have actually read both facts.
  //
  // Two things read as "no account" before they are known, and both used to
  // bounce a perfectly valid account into onboarding:
  //
  //  1. `account` from the persisted wallet store is the SERVER snapshot
  //     (null) for React's hydration render, so a connected wallet looks
  //     disconnected for exactly one pass. The store itself is already
  //     rehydrated by the time effects run, so ask it directly instead of
  //     trusting that first render.
  //  2. `usePosition` has no data while it is pending, and no data when the
  //     read fails for reasons that say nothing about whether an account
  //     exists (503, timeout, expired token). Neither is grounds to send
  //     someone back through onboarding.
  useEffect(() => {
    if (!walletHydrated) return;
    // `?? getState()` covers the hydration-render snapshot described above.
    const connectedAccount = publicKey ?? useWalletStore.getState().account ?? undefined;
    if (!connectedAccount) {
      router.replace("/farming/setup");
      return;
    }
    if (noManagedAccount) router.replace("/farming/setup");
  }, [walletHydrated, publicKey, noManagedAccount, router]);

  const { isLoading: registryPoolsLoading } = usePools();

  const { data: positionHistory } = usePositionHistory(position?.keeperWalletAddress);

  // Defensive auto-register for portfolio snapshot history. Existing accounts
  // that predate the backend auto-register need this to start accumulating
  // chart data. Backend is idempotent - returns {registered:false} if already
  // tracked. Fire-and-forget; failures don't block the dashboard.
  useEffect(() => {
    const addr = position?.keeperWalletAddress;
    if (!addr) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${apiBase}/api/portfolio/snapshot`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: addr }),
    }).catch(() => {
      // ignore - idempotent on backend
    });
  }, [position?.keeperWalletAddress]);

  const {
    data: activities,
    isLoading: activitiesLoading,
    refetch: refetchActivity,
  } = useActivity(publicKey);

  const actions = useFarmingActions(publicKey);

  // Defensive guards: backend may return non-array shapes that slip past `?? []`
  // (which only catches null/undefined). Centralize here so every consumer
  // routes through a safe array.
  const positionsList = useMemo(
    () => (Array.isArray(position?.positions) ? position.positions : []),
    [position?.positions]
  );

  const activitiesList = useMemo(() => (Array.isArray(activities) ? activities : []), [activities]);

  const { availableUsd, lockedUsd } = useMemo(() => {
    const isBalanceStale = Boolean(position?.balanceStale);
    let available = 0;
    let locked = 0;
    let positionsTotal = 0;
    for (const pos of positionsList) {
      positionsTotal += pos.valueUsd;
      if (pos.poolType === "backstop" && pos.q4wExpiresAt) locked += pos.valueUsd;
      else available += pos.valueUsd;
    }
    const walletAvailable = isBalanceStale
      ? 0
      : Math.max((position?.totalValueUsd ?? 0) - positionsTotal, 0);
    available += walletAvailable;
    return { availableUsd: available, lockedUsd: locked };
  }, [positionsList, position?.totalValueUsd, position?.balanceStale]);

  const userPositionUsd = useMemo(() => {
    if (!poolDrawer) return 0;
    const drawerName = `${poolDrawer.assetSymbol}${
      poolDrawer.pairedAssetSymbol ? `/${poolDrawer.pairedAssetSymbol}` : ""
    }`;
    const match = positionsList.find(
      (p) =>
        p.protocol.toLowerCase() === poolDrawer.protocol.toLowerCase() && p.poolName === drawerName
    );
    return match?.valueUsd ?? 0;
  }, [poolDrawer, positionsList]);

  const openModal = useCallback(
    (tab: FarmingModalTab) => {
      actions.setActionError(null);
      setModalTab(tab);
      setModalOpen(true);
    },
    [actions]
  );

  const handleFund = async (amount: number, token: "USDC" | "XLM") => {
    const ok = await actions.fund(amount, token);
    if (ok) {
      await Promise.all([refetchPosition(), refetchActivity()]);
      setModalOpen(false);
    }
  };

  const handleWithdraw = async () => {
    const parsed = Number.parseFloat(withdrawAmount);
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > availableUsd) return;
    const ok = await actions.withdraw(parsed);
    if (ok) {
      await Promise.all([refetchPosition(), refetchActivity()]);
      setWithdrawAmount("");
      setModalOpen(false);
    }
  };

  const handleRevoke = async () => {
    const ok = await actions.revoke();
    if (ok) {
      await Promise.all([refetchPosition(), refetchActivity()]);
      setModalOpen(false);
    }
  };

  const handleReactivate = useCallback(async () => {
    const ok = await actions.reactivate();
    if (ok) {
      await Promise.all([refetchPosition(), refetchActivity()]);
      setModalOpen(false);
    }
  }, [actions, refetchPosition, refetchActivity]);

  const handlePoolDeposit = useCallback(
    (_pool: DiscoveredPool) => {
      // pool argument unused by handler today; kept for Phase 2 per-pool routing
      setPoolDrawer(null);
      if (position?.status === "REVOKED") {
        // Drawer button reads "Reactivate Session" when revoked; route accordingly.
        void handleReactivate();
        return;
      }
      openModal("fund");
    },
    [position?.status, handleReactivate, openModal]
  );

  const handlePoolWithdraw = useCallback(
    (_pool: DiscoveredPool) => {
      // pool argument unused by handler today; kept for Phase 2 per-pool routing
      setWithdrawAmount(String(userPositionUsd.toFixed(2)));
      setPoolDrawer(null);
      openModal("withdraw");
    },
    [userPositionUsd, openModal]
  );

  if (!publicKey) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // `isPending` rather than `isLoading`: a query that is enabled but has not
  // started fetching yet is still "we don't know", and must show the loader
  // instead of falling through to the empty state.
  if (registryPoolsLoading || positionPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // A failed read is not an empty account (a 404 is - that path falls through
  // to the empty state below and the effect routes it to setup). Say so, and
  // offer the retry: rendering the "set up your farming account" CTA here
  // would tell a user with a live keeper wallet that they have none.
  if (positionUnreadable) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <h2 className="mb-2 font-bold text-2xl text-foreground">Couldn&apos;t read your account</h2>
        <p className="mb-6 max-w-md text-muted-foreground text-sm">
          Your funds and your keeper wallet are untouched - this is the read that failed, not the
          account. Try again in a moment.
        </p>
        <Button variant="outline" size="lg" className="h-11 px-8" onClick={() => refetchPosition()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!position || position.status === "DEPLOYING") {
    return (
      <GetStartedEmptyState
        resuming={position?.status === "DEPLOYING"}
        onStart={() => router.push("/farming/setup")}
      />
    );
  }

  const isRevoked = position.status === "REVOKED";

  // The backend contract guarantees these fields, but treat that as a
  // promise, not a fact: if a partial/malformed response ever slips through,
  // fall back to the loader instead of rendering a confident-looking
  // $0.00 / 0.00% dashboard that's indistinguishable from a real zero.
  const hasCompletePositionData =
    typeof position.totalValueUsd === "number" &&
    typeof position.totalDepositedUsd === "number" &&
    typeof position.profitUsd === "number" &&
    typeof position.profitPercent === "number" &&
    typeof position.currentApy === "number";

  if (!hasCompletePositionData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalBalanceUsd = position.totalValueUsd;
  const totalDepositedUsd = position.totalDepositedUsd;
  const lifetimeEarningsUsd = position.profitUsd;
  const lifetimeEarningsPct = position.profitPercent;
  // Value-weighted average APY across all open positions - not "net" of
  // fees/rewards, see AprSummaryCard.
  const blendedApy = position.currentApy;
  // Positions aren't guaranteed to come back ordered by size, so pick the
  // one holding the most value rather than an arbitrary array position.
  const topPosition = positionsList.length
    ? positionsList.reduce((largest, p) => (p.valueUsd > largest.valueUsd ? p : largest))
    : undefined;
  const currentMarketName = topPosition?.poolName ?? "-";
  const currentPositionApr = topPosition?.apy ?? 0;
  // Never fabricate a fallback timestamp - an empty string renders "-" via
  // AprSummaryCard's fmtDate rather than lying that the account activated
  // "now".
  const activatedAt = position.createdAt ?? "";

  const chartSeries = (positionHistory ?? []).map((s) => ({
    t: new Date(s.timestamp).getTime(),
    v: s.totalValueUsd,
  }));

  // Include "reward" alongside "protocol": harvest rows are categorised
  // "reward", so the event that actually realises yield never reached this
  // card. The old `a.type === "rebalance"` clause matched nothing either — the
  // API returns the enum upper-cased ("REBALANCE") — so that half of the
  // filter was dead and only appeared to work via the category check.
  const agentEvents: AgentHistoryEvent[] = activitiesList
    .filter(
      (a) =>
        a.category === "protocol" ||
        a.category === "reward" ||
        a.type?.toUpperCase() === "REBALANCE"
    )
    .map((a) => {
      // title and detail both fell back to `a.detail`, so every row without an
      // amount printed the same sentence twice and never named its type.
      const amount =
        a.amount !== undefined
          ? `${a.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${a.token ?? ""}`.trim()
          : null;
      return {
        id: a.id,
        title: ACTIVITY_LABEL[a.type] ?? a.type,
        detail: amount ?? a.detail ?? "",
        occurredAt: a.createdAt,
      };
    });

  return (
    <>
      <FarmingDashboard
        totalBalanceUsd={totalBalanceUsd}
        totalDepositedUsd={totalDepositedUsd}
        lifetimeEarningsUsd={lifetimeEarningsUsd}
        lifetimeEarningsPct={lifetimeEarningsPct}
        chartSeries={chartSeries}
        agentEvents={agentEvents}
        blendedApy={blendedApy}
        currentPositionApr={currentPositionApr}
        currentMarketName={currentMarketName}
        activatedAt={activatedAt}
        onAddFunds={() => {
          setModalOpen(true);
          setModalTab("fund");
        }}
        onDeactivate={() => {
          setModalOpen(true);
          setModalTab("security");
        }}
      />

      <FarmingModals
        open={modalOpen}
        tab={modalTab}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) actions.setActionError(null);
        }}
        actionError={actions.actionError}
        isPending={actions.isPending}
        onFund={handleFund}
        availableUsd={availableUsd}
        lockedUsd={lockedUsd}
        withdrawAmount={withdrawAmount}
        onWithdrawAmountChange={setWithdrawAmount}
        onWithdraw={handleWithdraw}
        onRevoke={handleRevoke}
        onReactivate={handleReactivate}
      />

      <ActivityDrawer
        open={activityDrawerOpen}
        onOpenChange={setActivityDrawerOpen}
        activities={activitiesList}
        isLoading={activitiesLoading}
      />

      <PoolDetailDrawer
        open={!!poolDrawer}
        onOpenChange={(open) => {
          if (!open) setPoolDrawer(null);
        }}
        pool={poolDrawer}
        userPositionUsd={userPositionUsd}
        isRevoked={isRevoked}
        onDeposit={handlePoolDeposit}
        onWithdraw={handlePoolWithdraw}
      />
    </>
  );
}

export function FarmingPage() {
  return (
    <Suspense>
      <FarmingContent />
    </Suspense>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Wallet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useActivity, usePosition, usePresets } from "@/features/account/hooks/use-account-api";
import type { RiskPreset } from "@/features/account/types";
import { RulebookPanel } from "@/features/transparency/components/rulebook-page";
import { isNotFoundError } from "@/lib/query-error";
import { Button } from "@/shared/ui/button";
import { useWalletHydrated, useWalletStore } from "@/store/use-wallet";
import { useFarmingActions } from "../hooks/use-farming-actions";
import { usePools } from "../hooks/use-farming-api";
import type { DiscoveredPool } from "../types";
import { FarmingActivity, FarmingActivitySidebar } from "./farming-activity";
import { FarmingAllocation } from "./farming-allocation";
import { FarmingModals, type FarmingModalTab } from "./farming-modals";
import { FarmingPools } from "./farming-pools";
import { FarmingStatusBanners } from "./farming-status-banners";
import { type FarmingTab, FarmingTabs, parseFarmingTab } from "./farming-tabs";
import { FarmingVaultHeader } from "./farming-vault-header";
import { PoolDetailDrawer } from "./pool-detail-drawer";
import { ManageTab } from "./tabs/manage-tab";

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
          : "Choose the asset and strategy your agent will use. One wallet signature, ~30 seconds."}
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

  const activeTab = parseFarmingTab(searchParams.get("tab"));

  const setActiveTab = useCallback(
    (tab: FarmingTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "overview") params.delete("tab");
      else params.set("tab", tab);
      const query = params.toString();
      router.replace(query ? `/farming?${query}` : "/farming");
    },
    [router, searchParams]
  );

  const [poolDrawer, setPoolDrawer] = useState<DiscoveredPool | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<FarmingModalTab>("fund");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [strategyPreviewAsset, setStrategyPreviewAsset] = useState<"USDC" | "XLM">("USDC");
  const [selectedPreset, setSelectedPreset] = useState<RiskPreset | null>(null);

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

  const { data: registryPoolsData, isLoading: registryPoolsLoading } = usePools();
  const { data: presets, isLoading: presetsLoading } = usePresets(strategyPreviewAsset);

  useEffect(() => {
    const baseAsset = position?.baseAsset?.toUpperCase();
    if (baseAsset === "USDC" || baseAsset === "XLM") setStrategyPreviewAsset(baseAsset);
  }, [position?.baseAsset]);

  useEffect(() => {
    if (selectedPreset !== null) return;
    const normalized = position?.preset?.toLowerCase();
    if (normalized === "safe") setSelectedPreset("Safe");
    else if (normalized === "aggressive") setSelectedPreset("Aggressive");
    else if (normalized === "balanced") setSelectedPreset("Balanced");
  }, [position?.preset, selectedPreset]);

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
  const registryPools = useMemo(
    () => (Array.isArray(registryPoolsData) ? registryPoolsData : []),
    [registryPoolsData]
  );

  const positionsTotalUsd = useMemo(
    () => positionsList.reduce((sum, item) => sum + item.valueUsd, 0),
    [positionsList]
  );
  const unallocatedWalletUsd = position?.balanceStale
    ? 0
    : Math.max((position?.totalValueUsd ?? 0) - positionsTotalUsd, 0);
  const inPositionKeys = useMemo(
    () => new Set(positionsList.map((item) => `${item.protocol.toLowerCase()}:${item.poolName}`)),
    [positionsList]
  );

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

  const handleApplyPreset = async () => {
    if (!selectedPreset) return;
    const ok = await actions.applyPreset(selectedPreset);
    if (ok) await refetchPosition();
  };

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

  return (
    <>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <FarmingVaultHeader
          totalValueUsd={position.totalValueUsd}
          allTimePnlUsd={position.profitUsd}
          allTimePnlPercent={position.profitPercent}
          currentApy={position.currentApy}
          status={position.status}
          onDeposit={() => openModal("fund")}
          onWithdraw={() => openModal("withdraw")}
          onSecurity={() => openModal(isRevoked ? "activate" : "security")}
        />

        <FarmingStatusBanners
          status={position.status}
          balanceStale={Boolean(position.balanceStale)}
          sessionKeyStale={Boolean(position.sessionKeyStale)}
          onRefresh={() => openModal("security")}
          onDeposit={() => openModal("fund")}
        />

        <FarmingTabs value={activeTab} onValueChange={setActiveTab} />

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.section
              key="overview"
              id="farming-panel-overview"
              role="tabpanel"
              aria-labelledby="farming-tab-overview"
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <FarmingAllocation
                  positions={positionsList}
                  unallocatedWalletUsd={unallocatedWalletUsd}
                  isLoading={false}
                />
                <FarmingActivitySidebar
                  activities={activitiesList}
                  isLoading={activitiesLoading}
                  onSeeAll={() => setActiveTab("activity")}
                />
              </div>
              <FarmingPools
                pools={registryPools}
                isLoading={registryPoolsLoading}
                inPositionKeys={inPositionKeys}
                onSelectPool={setPoolDrawer}
              />
            </motion.section>
          )}

          {activeTab === "pools" && (
            <motion.section
              key="pools"
              id="farming-panel-pools"
              role="tabpanel"
              aria-labelledby="farming-tab-pools"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <FarmingPools
                pools={registryPools}
                isLoading={registryPoolsLoading}
                inPositionKeys={inPositionKeys}
                onSelectPool={setPoolDrawer}
              />
            </motion.section>
          )}

          {activeTab === "strategy" && (
            <section
              key="strategy"
              id="farming-panel-strategy"
              role="tabpanel"
              aria-labelledby="farming-tab-strategy"
            >
              <ManageTab
                presets={presets}
                presetsLoading={presetsLoading}
                selectedPreset={selectedPreset}
                onSelectPreset={(preset) => {
                  actions.setActionError(null);
                  setSelectedPreset(preset);
                }}
                currentPreset={position.preset}
                previewAsset={strategyPreviewAsset}
                onChangePreviewAsset={setStrategyPreviewAsset}
                activeAssets={position.activeAssets ?? []}
                isRevoked={isRevoked}
                isUpdatingPreset={actions.isUpdatingPreset}
                actionError={actions.actionError}
                onApply={() => void handleApplyPreset()}
                pools={registryPools}
                poolsLoading={registryPoolsLoading}
                inPositionKeys={inPositionKeys}
                onSelectPool={setPoolDrawer}
              />
            </section>
          )}

          {activeTab === "activity" && (
            <section
              key="activity"
              id="farming-panel-activity"
              role="tabpanel"
              aria-labelledby="farming-tab-activity"
            >
              <FarmingActivity activities={activitiesList} isLoading={activitiesLoading} />
            </section>
          )}

          {activeTab === "rulebook" && (
            <motion.section
              key="rulebook"
              id="farming-panel-rulebook"
              role="tabpanel"
              aria-labelledby="farming-tab-rulebook"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <RulebookPanel />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

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

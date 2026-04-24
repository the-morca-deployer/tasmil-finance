"use client";
import { activeNetwork } from "@/shared/config/stellar";

import {
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/shared/ui/button-v2";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/store/use-wallet";

import {
  useDeployAccount,
  usePresets,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
} from "../hooks/use-account-api";
import type { RiskPreset } from "../types";
import { PresetCard } from "./preset-card";

/** Sub-steps within Step 1 (Create Account) */
type DeploySubStep =
  | "idle" // Not started
  | "building_deploy" // Building deploy TX from backend
  | "signing_deploy" // Waiting for user to sign TX 1/2
  | "submitting_deploy" // Submitting + confirming deploy TX
  | "building_setup" // Building setup TX from backend
  | "signing_setup" // Waiting for user to sign TX 2/2
  | "submitting_setup" // Submitting + confirming setup TX
  | "applying_preset" // Calling updatePreset after deploy+setup succeed
  | "done"; // Everything confirmed

/** User-friendly labels for each sub-step */
function getDeployStatusLabel(subStep: DeploySubStep): string {
  switch (subStep) {
    case "building_deploy":
      return "Preparing deploy transaction...";
    case "signing_deploy":
      return "Sign transaction 1 of 2 — Deploy Account";
    case "submitting_deploy":
      return "Submitting deploy transaction...";
    case "building_setup":
      return "Preparing setup transaction...";
    case "signing_setup":
      return "Sign transaction 2 of 2 — Configure Session Key";
    case "submitting_setup":
      return "Submitting setup transaction...";
    case "applying_preset":
      return "Applying your strategy...";
    case "done":
      return "Account created successfully!";
    default:
      return "";
  }
}

const DEFAULT_PRESET: RiskPreset = "Balanced";

export function OnboardingPage() {
  const router = useRouter();
  const { account } = useWalletStore();
  const publicKey = account ?? null;

  // User's preset pick. Defaults to Balanced (most users should start here).
  const [selectedPreset, setSelectedPreset] = useState<RiskPreset>(DEFAULT_PRESET);

  // Base asset the user plans to deposit. Presets API returns different
  // pool universes per asset; the UI toggle lets the user preview both
  // before they fund.
  const [selectedBaseAsset, setSelectedBaseAsset] = useState<"USDC" | "XLM">("USDC");

  // Deploy sub-step tracking
  const [deploySubStep, setDeploySubStep] = useState<DeploySubStep>("idle");
  const [deployCompleted, setDeployCompleted] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Guard: prevent double-click while flow is in progress
  const flowInProgressRef = useRef(false);

  const { data: presets, isLoading: presetsLoading } = usePresets(selectedBaseAsset);
  const deployAccount = useDeployAccount();
  const setupAccount = useSetupAccount();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();

  // Helper to get StellarWalletsKit + passphrase
  const getStellarKit = async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
    const passphrase =
      activeNetwork.networkPassphrase;
    return { StellarWalletsKit, passphrase };
  };

  /**
   * Normalise wallet-signing result: some Stellar wallet adapters RESOLVE
   * with an empty / undefined signedTxXdr on user rejection instead of
   * throwing. Treat any non-string / empty result as an explicit cancel.
   */
  const assertSigned = (
    signResult: { signedTxXdr?: string } | null | undefined,
  ): string => {
    const xdr = signResult?.signedTxXdr;
    if (typeof xdr !== "string" || xdr.length === 0) {
      const err = new Error("User rejected transaction signing");
      (err as Error & { userRejected?: boolean }).userRejected = true;
      throw err;
    }
    return xdr;
  };

  // ---- Step 1a: Deploy keeper wallet contract (TX 1/2) ----
  const handleDeployTx = async (): Promise<boolean> => {
    if (!publicKey) return false;

    setDeploySubStep("building_deploy");
    const result = await deployAccount.mutateAsync(publicKey);

    if (!result?.xdr) {
      throw new Error("No deploy transaction returned from server");
    }

    setDeploySubStep("signing_deploy");
    const { StellarWalletsKit, passphrase } = await getStellarKit();
    const signed = await StellarWalletsKit.signTransaction(result.xdr, {
      address: publicKey,
      networkPassphrase: passphrase,
    });
    const signedTxXdr = assertSigned(signed);

    setDeploySubStep("submitting_deploy");
    await submitTx.mutateAsync({
      signedXdr: signedTxXdr,
      publicKey,
      txType: "deploy",
    });

    setDeployCompleted(true);
    return true;
  };

  // ---- Step 1b: Configure session key (TX 2/2) ----
  const handleSetupTx = async (): Promise<boolean> => {
    if (!publicKey) return false;

    setDeploySubStep("building_setup");
    const setupResult = await setupAccount.mutateAsync(publicKey);
    const setupXdrs = setupResult?.setupTxs ?? [];

    if (setupXdrs.length === 0) {
      throw new Error("No setup transaction returned from server");
    }

    const setupXdr = setupXdrs[0];
    if (!setupXdr) {
      throw new Error("Invalid setup transaction payload");
    }

    setDeploySubStep("signing_setup");
    const { StellarWalletsKit, passphrase } = await getStellarKit();
    const signed = await StellarWalletsKit.signTransaction(setupXdr, {
      address: publicKey,
      networkPassphrase: passphrase,
    });
    const signedTxXdr = assertSigned(signed);

    setDeploySubStep("submitting_setup");
    await submitTx.mutateAsync({
      signedXdr: signedTxXdr,
      publicKey,
      txType: "setup",
    });

    setSetupCompleted(true);
    return true;
  };

  // ---- Step 2: Apply the chosen preset (skip if Balanced == default) ----
  const applyChosenPreset = async (): Promise<boolean> => {
    if (!publicKey) return false;

    // Backend seeds BALANCED on signup, so only push when the user picked
    // something else. Saves a request + avoids a noop activity row.
    if (selectedPreset === DEFAULT_PRESET) return true;

    setDeploySubStep("applying_preset");
    // preset API expects uppercase ("SAFE" | "BALANCED" | "AGGRESSIVE")
    await updatePreset.mutateAsync({
      publicKey,
      preset: selectedPreset.toUpperCase(),
    });
    return true;
  };

  // ---- Combined flow: Deploy → Setup → Apply Preset ----
  const handleDeploy = async () => {
    if (!publicKey || flowInProgressRef.current) return;

    flowInProgressRef.current = true;
    setDeployError(null);

    let allDone = false;
    try {
      // TX 1 (skip if already confirmed on a retry)
      if (!deployCompleted) {
        await handleDeployTx();
      }
      // TX 2 (skip if already confirmed on a rare preset-only retry)
      if (!setupCompleted) {
        await handleSetupTx();
      }
      // Preset: non-fatal. If it fails, the account still works on BALANCED
      // and the user can change it later via the Strategy tab.
      try {
        await applyChosenPreset();
      } catch (presetErr: any) {
        console.warn(
          "Preset application failed; leaving account on default BALANCED:",
          presetErr?.message ?? presetErr,
        );
      }
      setDeploySubStep("done");
      allDone = true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Account creation failed:", message);

      const rejected =
        (err as { userRejected?: boolean })?.userRejected === true ||
        message.includes("User rejected") ||
        message.includes("user rejected") ||
        message.includes("User denied") ||
        message.includes("declined") ||
        message.includes("cancelled");
      if (rejected) {
        const step = !deployCompleted
          ? "deploy"
          : !setupCompleted
            ? "session-key setup"
            : "strategy update";
        setDeployError(
          `Transaction signing was cancelled at the ${step} step. ` +
            (deployCompleted && !setupCompleted
              ? "Your account was deployed but session key setup didn't complete — click retry to finish."
              : "Please try again."),
        );
      } else if (message.includes("insufficient") || message.includes("Insufficient")) {
        setDeployError("Insufficient XLM balance. Please fund your wallet and try again.");
      } else if (message.includes("timed out")) {
        setDeployError("Transaction confirmation timed out. Please try again.");
      } else {
        setDeployError(message);
      }
      setDeploySubStep("idle");
    } finally {
      flowInProgressRef.current = false;
      // Navigate ONLY when the full flow (deploy + setup) succeeded. Preset
      // apply is best-effort and already caught above, so a preset failure
      // still lets us navigate to the dashboard where the user can retry.
      if (allDone) {
        router.push("/farming");
      }
    }
  };

  // ---- Not connected ----
  if (!publicKey) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your Stellar wallet to create a smart account and get started.
        </p>
      </div>
    );
  }

  const isDeploying = deploySubStep !== "idle" && deploySubStep !== "done";
  const getDeployButtonLabel = (): string => {
    if (isDeploying) return getDeployStatusLabel(deploySubStep);
    if (deployCompleted && !setupCompleted) return "Retry Setup (Transaction 2 of 2)";
    return "Create Smart Account";
  };

  // Warning shown below any preset whose effective APY is below this floor.
  // Users deserve a heads-up before picking an allocation that pays ~nothing.
  const LOW_APY_THRESHOLD_PCT = 1;
  const showLowApyWarning =
    presets?.some(
      (p) => p.name === selectedPreset && p.estimatedApy < LOW_APY_THRESHOLD_PCT,
    ) ?? false;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-primary/8 via-white/3 to-transparent p-8 text-center md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,139,253,0.12),transparent_60%)]" />
          <div className="relative mx-auto max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary text-xs">
              <Sparkles className="h-3 w-3" />
              <span className="font-medium">Automated yield on Stellar</span>
            </div>
            <h1 className="mb-3 font-bold text-3xl text-foreground tracking-tight md:text-4xl">
              Set Up Your Smart Account
            </h1>
            <p className="text-muted-foreground">
              Pick a deposit asset and strategy. Your funds stay self-custody — we handle
              rebalancing, harvesting, and compounding automatically.
            </p>
          </div>
        </div>
      </div>

      {/* ── Step 1 — Deposit asset ───────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary text-xs">
            1
          </div>
          <h2 className="font-semibold text-foreground text-lg">Choose deposit asset</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 md:max-w-md">
          {(
            [
              {
                id: "USDC" as const,
                label: "USDC",
                subtitle: "Stablecoin · highest APY",
              },
              {
                id: "XLM" as const,
                label: "XLM",
                subtitle: "Native asset",
              },
            ]
          ).map((asset) => {
            const isActive = selectedBaseAsset === asset.id;
            return (
              <button
                type="button"
                key={asset.id}
                disabled={isDeploying}
                onClick={() => {
                  if (!isDeploying) setSelectedBaseAsset(asset.id);
                }}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  isActive
                    ? "border-primary/50 bg-primary/10 ring-2 ring-primary/40"
                    : "border-white/8 bg-white/3 hover:border-white/12 hover:bg-white/5",
                )}
              >
                <div className="font-semibold text-foreground">{asset.label}</div>
                <div className="mt-0.5 text-muted-foreground text-xs">{asset.subtitle}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Step 2 — Strategy picker ─────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary text-xs">
            2
          </div>
          <h2 className="font-semibold text-foreground text-lg">Choose your strategy</h2>
          <span className="text-muted-foreground text-xs">
            Change any time from the dashboard
          </span>
        </div>

        {presetsLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/6 bg-white/3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : presets && presets.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {presets.map((preset) => (
              <PresetCard
                key={preset.name}
                preset={preset}
                selected={selectedPreset === preset.name}
                onSelect={() => {
                  if (!isDeploying) setSelectedPreset(preset.name);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-muted/10 p-6 text-center text-muted-foreground text-sm">
            Strategy options are loading. If this persists, please refresh the page.
          </div>
        )}

        {/* Low-APY heads-up — context depends on base asset */}
        {showLowApyWarning && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="text-sm">
              <p className="font-medium text-amber-200">
                This preset currently earns less than 1% APY
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                {selectedBaseAsset === "XLM"
                  ? "Mainnet XLM lending demand is low, so blend/XLM pays near-zero. Consider Balanced or Aggressive for meaningful yield with XLM, or switch the deposit asset to USDC for ~5–9% APY."
                  : "Pool yields can fluctuate with on-chain activity. You can change strategy any time."}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Step 3 — Account creation ────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary text-xs">
            3
          </div>
          <h2 className="font-semibold text-foreground text-lg">Create your smart account</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_1fr]">
          {/* Left: guarantees / trust column */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
            <p className="text-muted-foreground text-sm leading-relaxed">
              A Tasmil smart account is a self-custody Stellar contract with scoped session
              keys. You stay in control — the keeper bot can only execute pre-approved
              actions like rebalancing between the pools you see above.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Self-custody",
                  body: "Your keys, your funds. We never touch principal.",
                },
                {
                  icon: Zap,
                  title: "Session-key automation",
                  body: "Scoped permissions sign rebalances without your wallet.",
                },
                {
                  icon: CheckCircle,
                  title: "Revokable anytime",
                  body: "One-click revoke returns full control to your wallet.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-muted-foreground text-xs">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: summary + CTA column */}
          <div className="flex flex-col rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/8 via-white/3 to-transparent p-6">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">
              Your selection
            </p>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Deposit asset</span>
                <span className="font-semibold text-foreground">{selectedBaseAsset}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Strategy</span>
                <span className="font-semibold text-foreground">{selectedPreset}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Est. APY</span>
                <span className="font-mono font-semibold text-primary">
                  {presets?.find((p) => p.name === selectedPreset)?.estimatedApy?.toFixed(2) ?? "—"}
                  %
                </span>
              </div>
            </div>

            {/* Progress / retry banners */}
            {isDeploying && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <p className="font-medium text-primary text-xs">
                    {getDeployStatusLabel(deploySubStep)}
                  </p>
                </div>
                <p className="mt-1 text-muted-foreground text-xs">
                  2 signatures total — keep Freighter open.
                </p>
              </div>
            )}

            {deployCompleted && !setupCompleted && deploySubStep === "idle" && (
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="font-medium text-amber-300 text-xs">
                  Deploy ✓ — one signature left
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Session key not configured. Click retry to finish.
                </p>
              </div>
            )}

            {deployError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                <p className="text-destructive text-xs leading-relaxed">{deployError}</p>
              </div>
            )}

            <div className="mt-auto pt-5">
              <Button
                variant="gradient"
                size="lg"
                className="h-12 w-full"
                onClick={handleDeploy}
                disabled={isDeploying || presetsLoading}
              >
                {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {getDeployButtonLabel()}
              </Button>
              <p className="mt-2 text-center text-muted-foreground text-xs">
                You'll sign 2 transactions (~30 seconds) in your Stellar wallet.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

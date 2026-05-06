"use client";

import { ChevronLeft, Info, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import type { RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import type { Asset } from "../shared/asset-pill";

const MIN_AMOUNTS: Record<Asset, number> = {
  USDC: 1,
  XLM: 10,
};

const OPTIMIZER_THRESHOLD = 25_000;

interface Props {
  asset: Asset;
  preset: RiskPreset;
  estimatedApy: number;
  poolCount: number;
  balances: Record<Asset, number>;
  onAssetChange: (asset: Asset) => void;
  isFunding: boolean;
  onFund: (amount: number, asset: Asset) => void;
  onBack?: () => void;
}

export function StepDeposit({
  asset,
  estimatedApy,
  poolCount,
  balances,
  onAssetChange,
  isFunding,
  onFund,
  onBack,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const inputId = useId();

  const balance = balances[asset] ?? 0;
  const parsed = Number.parseFloat(amount);
  const min = MIN_AMOUNTS[asset];
  const isValid = !Number.isNaN(parsed) && parsed >= min;
  const exceedsBalance = isValid && parsed > balance;
  const canSubmit = isValid && !exceedsBalance && !isFunding;
  const projectedYearly = isValid ? parsed * (estimatedApy / 100) : null;

  const exceedsToastRef = useRef(false);
  useEffect(() => {
    if (exceedsBalance && !exceedsToastRef.current) {
      exceedsToastRef.current = true;
      toast.error(`Exceeds your available ${asset} balance.`);
    }
    if (!exceedsBalance) exceedsToastRef.current = false;
  }, [exceedsBalance, asset]);

  const handleAssetSwitch = (next: Asset) => {
    if (next === asset) return;
    setAmount("");
    exceedsToastRef.current = false;
    onAssetChange(next);
  };

  const handleMax = () => {
    if (balance <= 0) return;
    const max = asset === "XLM" ? Math.max(0, balance - 2) : balance;
    setAmount(max.toFixed(asset === "USDC" ? 2 : 4));
  };

  const formattedAvailable = balance.toLocaleString("en-US", {
    minimumFractionDigits: balance > 0 ? 2 : 0,
    maximumFractionDigits: asset === "USDC" ? 2 : 4,
  });

  const formatAssetBalance = (a: Asset, n: number): string =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: a === "USDC" ? 2 : 4,
    });

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col bg-background px-6 pt-6 pb-24">
      {onBack && (
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="absolute top-4 left-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 pt-10">
        {/* Hero */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">Your Deposit</p>
            <div
              role="radiogroup"
              aria-label="Deposit asset"
              className="inline-flex rounded-full border border-border bg-muted/30 p-0.5"
            >
              {(["USDC", "XLM"] as const).map((a) => {
                const isActive = a === asset;
                return (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    disabled={isFunding}
                    onClick={() => handleAssetSwitch(a)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      isActive
                        ? "bg-foreground/10 font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{a}</span>
                    <span className="font-mono text-[10px] tabular-nums opacity-70">
                      {formatAssetBalance(a, balances[a] ?? 0)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <input
              id={inputId}
              aria-label="Deposit amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="min-w-0 max-w-[320px] bg-transparent font-light text-5xl text-foreground tabular-nums outline-none placeholder:text-foreground/55 md:text-6xl"
              size={6}
            />
            <span className="font-light text-5xl text-foreground/55 md:text-6xl">{asset}</span>
            <button
              type="button"
              onClick={handleMax}
              className="ml-auto rounded-md px-2 py-1 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
            >
              Max
            </button>
          </div>
          <p className="text-muted-foreground text-xs">
            {formattedAvailable} {asset} available
          </p>
        </section>

        <Divider />

        {/* Stats — 2x2 grid */}
        <section className="grid grid-cols-2 gap-x-12 gap-y-8">
          <StatCell label="You'll earn /per year">
            {projectedYearly === null
              ? "—"
              : `$${projectedYearly.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
          </StatCell>
          <StatCell label="APR" hint>
            {isValid ? `${estimatedApy.toFixed(1)}%` : "—"}
          </StatCell>
          <StatCell label="Markets" hint>
            {poolCount} markets
          </StatCell>
          <StatCell label="Allocate to at least" hint>
            <span className="underline decoration-dotted underline-offset-4">1 market</span>
          </StatCell>
        </section>

        <Divider />

        {/* Bottom row: optimizer-locked notice + deposit orb */}
        <section className="flex items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="flex items-center gap-2 font-semibold text-foreground text-xl">
              Optimizer locked
              <Lock className="h-4 w-4 text-foreground/70" />
            </h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              Fine-grained controls for exposure and diversification are available for deposits
              above {OPTIMIZER_THRESHOLD.toLocaleString("en-US")} USDC. System constraints take
              precedence.
            </p>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onFund(parsed, asset)}
            aria-label="Deposit"
            className={cn(
              "flex h-[200px] w-[200px] shrink-0 items-center justify-center rounded-full font-medium text-lg transition-transform duration-200 md:h-[240px] md:w-[240px] md:text-xl",
              canSubmit
                ? "text-zinc-900 hover:scale-[1.02] active:scale-[0.99]"
                : "cursor-not-allowed bg-zinc-800 text-muted-foreground"
            )}
            style={
              canSubmit
                ? {
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(197,240,255,0.95) 0%, rgba(125,217,255,0.92) 25%, rgba(56,182,240,0.88) 55%, rgba(0,140,200,0.85) 100%), radial-gradient(circle at 75% 75%, rgba(0,191,255,0.55), transparent 60%)",
                    boxShadow:
                      "0 0 100px rgba(0,191,255,0.35), inset 0 4px 50px rgba(255,255,255,0.3), inset 0 -8px 50px rgba(2,80,120,0.4)",
                  }
                : undefined
            }
          >
            {isFunding ? <Loader2 className="h-7 w-7 animate-spin" /> : "Deposit"}
          </button>
        </section>

        <button
          type="button"
          onClick={() => router.push("/farming")}
          className="self-center text-muted-foreground text-sm underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Skip for now
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-6 max-w-[160px] text-muted-foreground/70 text-xs leading-snug">
        Your portfolio keeps
        <br />
        thinking even when
        <br />
        you don't.
      </div>

      <div className="pointer-events-none absolute right-6 bottom-6 text-right text-muted-foreground/70 text-xs leading-snug">
        © 2026 Tasmil
        <br />
        X / Linkedin
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-border/60" />;
}

function StatCell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <span>{label}</span>
        {hint && <Info className="h-3.5 w-3.5 opacity-60" />}
      </div>
      <p className="font-mono text-foreground tabular-nums">{children}</p>
    </div>
  );
}

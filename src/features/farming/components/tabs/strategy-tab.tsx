"use client";

import { motion } from "framer-motion";
import { Loader2, ShieldOff } from "lucide-react";
import { PresetCard } from "@/features/account/components/preset-card";
import type { PresetCardData, RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";

interface StrategyTabProps {
  presets: PresetCardData[] | undefined;
  presetsLoading: boolean;
  selectedPreset: RiskPreset | null;
  onSelectPreset: (preset: RiskPreset) => void;
  currentPreset: string | undefined;
  previewAsset: "USDC" | "XLM";
  onChangePreviewAsset: (asset: "USDC" | "XLM") => void;
  activeAssets: string[];
  isRevoked: boolean;
  isUpdating: boolean;
  actionError: string | null;
  onApply: () => void;
}

export function StrategyTab({
  presets,
  presetsLoading,
  selectedPreset,
  onSelectPreset,
  currentPreset,
  previewAsset,
  onChangePreviewAsset,
  activeAssets,
  isRevoked,
  isUpdating,
  actionError,
  onApply,
}: StrategyTabProps) {
  const currentPresetLabel = currentPreset
    ? currentPreset.charAt(0) + currentPreset.slice(1).toLowerCase()
    : "Balanced";
  const activeAssetsUpper = activeAssets.map((a) => a.toUpperCase());

  return (
    <motion.div
      key="strategy"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="font-semibold text-foreground text-xl">Choose Your Strategy</h2>
          <p className="text-muted-foreground text-sm">
            Your current preset is{" "}
            <span className="font-medium text-foreground">{currentPresetLabel}</span>. The same
            preset applies to both USDC and XLM deposits — each portion is allocated through its
            asset-specific pools.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground/70 text-[11px] uppercase tracking-widest">
            Preview allocation for
          </span>
          {(["USDC", "XLM"] as const).map((asset) => {
            const isActive = previewAsset === asset;
            const isCurrentBase = activeAssetsUpper.includes(asset);
            return (
              <button
                type="button"
                key={asset}
                onClick={() => onChangePreviewAsset(asset)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-foreground ring-1 ring-primary/40"
                    : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/12 hover:text-foreground"
                )}
              >
                <span className="font-semibold">{asset}</span>
                {isCurrentBase && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                    active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isRevoked && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm">
          <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            Session key is revoked. Reactivate from the Security action before changing your
            strategy.
          </p>
        </div>
      )}

      {presetsLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : presets && presets.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {presets.map((preset) => (
              <PresetCard
                key={preset.name}
                preset={preset}
                selected={selectedPreset === preset.name}
                onSelect={() => {
                  if (!isRevoked && !isUpdating) onSelectPreset(preset.name);
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-end gap-3">
            {actionError && <p className="text-destructive text-sm">{actionError}</p>}
            <Button
              variant="gradient"
              size="lg"
              className="h-11 px-6"
              onClick={onApply}
              disabled={
                isRevoked ||
                !selectedPreset ||
                selectedPreset?.toUpperCase() === currentPreset?.toUpperCase() ||
                isUpdating
              }
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Strategy
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-border bg-muted/10 p-6 text-center text-muted-foreground text-sm">
          Strategy options are loading. If this persists, please refresh the page.
        </div>
      )}
    </motion.div>
  );
}

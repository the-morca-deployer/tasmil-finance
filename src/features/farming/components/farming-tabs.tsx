"use client";

import { motion } from "framer-motion";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export const FARMING_TABS = ["overview", "pools", "strategy", "activity", "rulebook"] as const;

export type FarmingTab = (typeof FARMING_TABS)[number];

const TAB_LABEL: Record<FarmingTab, string> = {
  overview: "Overview",
  pools: "Pools",
  strategy: "Strategy",
  activity: "Activity",
  rulebook: "My Rulebook",
};

export function parseFarmingTab(value: string | null): FarmingTab {
  return FARMING_TABS.includes(value as FarmingTab) ? (value as FarmingTab) : "overview";
}

interface FarmingTabsProps {
  value: FarmingTab;
  onValueChange: (value: FarmingTab) => void;
}

export function FarmingTabs({ value, onValueChange }: FarmingTabsProps) {
  const selectFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>, tab: FarmingTab) => {
    const index = FARMING_TABS.indexOf(tab);
    let next: FarmingTab | undefined;
    if (event.key === "ArrowRight") next = FARMING_TABS[(index + 1) % FARMING_TABS.length];
    else if (event.key === "ArrowLeft") {
      next = FARMING_TABS[(index - 1 + FARMING_TABS.length) % FARMING_TABS.length];
    } else if (event.key === "Home") next = FARMING_TABS[0];
    else if (event.key === "End") next = FARMING_TABS[FARMING_TABS.length - 1];
    if (!next) return;

    event.preventDefault();
    onValueChange(next);
    document.getElementById(`farming-tab-${next}`)?.focus();
  };

  return (
    <div className="overflow-x-auto border-border/70 border-b" data-onborda="farming-tabs">
      <div
        role="tablist"
        aria-label="Vault sections"
        className="flex min-w-max items-center gap-6 px-1 sm:gap-7 sm:px-2"
      >
        {FARMING_TABS.map((tab) => {
          const selected = tab === value;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`farming-panel-${tab}`}
              id={`farming-tab-${tab}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onValueChange(tab)}
              onKeyDown={(event) => selectFromKeyboard(event, tab)}
              className={cn(
                "relative whitespace-nowrap pb-3 font-medium text-sm transition-colors sm:text-base",
                selected ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {TAB_LABEL[tab]}
              {selected && (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                  layoutId="farming-tab-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

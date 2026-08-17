"use client";

/**
 * Page chrome, ported from the "heron-console" half of heron's `shell.tsx`.
 *
 * Only that half: heron's other shell carries a multi-page sidebar for a
 * product with many routes, and `/farming-3` is one route. What survives is the
 * measured frame — a `max-w-[1440px]` column, `px-5 sm:px-9` gutters, a sticky
 * opaque header band that content scrolls under, and a generous bottom pad.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Rail } from "./console-ui";

export interface ConsoleShellProps {
  children: ReactNode;
  /** Right-hand chrome: wallet pill, actions. */
  actions?: ReactNode;
  /** Flow position, 0..1. Omitted on the dashboard, which is not a step. */
  progress?: number;
  className?: string;
}

export function ConsoleShell({ children, actions, progress, className }: ConsoleShellProps) {
  return (
    <div className={cn("min-h-full bg-background", className)}>
      <div className="mx-auto max-w-[1440px] px-5 sm:px-9">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl">
          <div className="flex h-[74px] flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-semibold text-[15px] text-foreground tracking-tight">
                Farming console
              </span>
              <span className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.12em]">
                Stellar mainnet
              </span>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
          </div>
          {progress !== undefined && <Rail value={progress} className="mb-px" />}
        </div>

        <main className="overflow-x-clip pt-6 pb-24">{children}</main>
      </div>
    </div>
  );
}

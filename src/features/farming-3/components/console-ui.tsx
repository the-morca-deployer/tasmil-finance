/**
 * Console primitives for `/farming-3`.
 *
 * Heron's console leans on a private `--hc-*` token set and, in `hc-ui.tsx`, on
 * inline styles that reference it. None of that is ported: `tasmil-finance`
 * already has a token vocabulary (`card` / `border` / `muted-foreground` /
 * `primary` / `destructive`) wired through Tailwind, and adding a second one
 * would leave two dialects in one repo. What IS ported is heron's structure and
 * its discipline — flat surfaces, an eyebrow above every number, tabular
 * figures, hairline rules instead of boxes.
 *
 * `Value` is the load-bearing piece. It renders three visibly different states
 * and refuses to collapse them:
 *
 *   loading  →  a shimmer, no number at all
 *   absent   →  a dim em dash plus a reason, never "$0.00"
 *   measured →  the number, even when that number is zero
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { NO_DATA } from "../utils/format";

/* ── surfaces ─────────────────────────────────────────────────────────────── */

export function Panel({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card/60 p-5 sm:p-6", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  meta,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-baseline justify-between gap-2", className)}>
      <h2 className="font-semibold text-[15px] text-foreground tracking-tight">{title}</h2>
      {meta != null && <div className="text-[12.5px] text-muted-foreground">{meta}</div>}
    </div>
  );
}

/** Small caps label above a number. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "font-medium text-[11px] text-muted-foreground/80 uppercase tracking-[0.1em]",
        className
      )}
    >
      {children}
    </p>
  );
}

/** Tabular figures. Every number on the console wears this; no prose does. */
export function Num({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{children}</span>;
}

export function Hairline({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}

/** Section rule: a caption with a hairline eating the rest of the width. */
export function SectionRule({ label, className }: { label: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.06em]">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ── tri-state value ──────────────────────────────────────────────────────── */

export interface ValueProps {
  /** `undefined` / `null` means "we do not have this", NOT "this is zero". */
  children: ReactNode;
  loading?: boolean;
  /** True when the underlying number was absent. Renders the em dash. */
  absent?: boolean;
  /** Why it is absent, one short clause. Shown under the dash. */
  absentNote?: string;
  className?: string;
  skeletonClassName?: string;
}

export function Value({
  children,
  loading,
  absent,
  absentNote,
  className,
  skeletonClassName,
}: ValueProps) {
  if (loading) {
    return <Skeleton className={cn("h-7 w-24", skeletonClassName)} />;
  }
  if (absent) {
    return (
      <span className={cn("inline-flex flex-col", className)}>
        <span className="text-muted-foreground/60" title={absentNote ?? "No value reported"}>
          {NO_DATA}
        </span>
        {absentNote && (
          <span className="mt-0.5 font-normal text-[11px] text-muted-foreground/70 tracking-normal">
            {absentNote}
          </span>
        )}
      </span>
    );
  }
  return <span className={cn("tabular-nums", className)}>{children}</span>;
}

/* ── metrics ──────────────────────────────────────────────────────────────── */

export type StatTone = "neutral" | "positive" | "negative" | "accent";

const STAT_TONE: Record<StatTone, string> = {
  neutral: "text-foreground",
  positive: "text-emerald-400",
  negative: "text-destructive",
  accent: "text-primary",
};

/** Flat label/value stack. Heron's `HcStat`, in tasmil tokens. */
export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  loading,
  absent,
  absentNote,
  size = "md",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: StatTone;
  loading?: boolean;
  absent?: boolean;
  absentNote?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = size === "lg" ? "text-[30px]" : size === "sm" ? "text-[16px]" : "text-[21px]";
  return (
    <div className={className}>
      <Eyebrow>{label}</Eyebrow>
      <div
        className={cn(
          "mt-2 font-semibold leading-none tracking-tight",
          sizeClass,
          !absent && STAT_TONE[tone]
        )}
      >
        <Value
          loading={loading}
          absent={absent}
          absentNote={absentNote}
          skeletonClassName={size === "lg" ? "h-8 w-32" : "h-6 w-20"}
        >
          {value}
        </Value>
      </div>
      {!loading && !absent && sub != null && (
        <div className="mt-1.5 text-[11.5px] text-muted-foreground/80">{sub}</div>
      )}
    </div>
  );
}

/** A KPI strip bounded by hairlines rather than a grid of boxes. */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-6 border-border border-t border-b py-5 md:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── pills & chips ────────────────────────────────────────────────────────── */

export type PillTone = "positive" | "accent" | "neutral" | "warn" | "negative";

const PILL_TONE: Record<PillTone, string> = {
  positive: "bg-emerald-500/12 text-emerald-400",
  accent: "bg-primary/12 text-primary",
  neutral: "bg-muted/50 text-muted-foreground",
  warn: "bg-amber-500/12 text-amber-400",
  negative: "bg-destructive/12 text-destructive",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-[11px]",
        PILL_TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Chip({
  children,
  active,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ── flow position ────────────────────────────────────────────────────────── */

/** "Step 2 of 4" — driven by the caller's list length, never a literal. */
export function StepIndicator({
  step,
  total,
  className,
}: {
  step: number;
  total: number;
  className?: string;
}) {
  return (
    <div
      className={cn("text-[12px] text-muted-foreground/70 uppercase tracking-[0.08em]", className)}
    >
      Step {step} of {total}
    </div>
  );
}

/** Thin progress rail. `value` is a fraction 0..1. */
export function Rail({ value, className }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className={cn("h-1 w-full overflow-hidden rounded-full bg-muted/60", className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── empty / loading copy ─────────────────────────────────────────────────── */

/**
 * The empty state. Takes a sentence saying WHY the list is empty, because
 * "nothing here" and "we could not read it" are different claims.
 */
export function EmptyNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("py-8 text-center text-[13px] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function RowSkeletons({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder list with no identity
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

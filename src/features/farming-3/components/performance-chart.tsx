"use client";

/**
 * The performance chart — the console's one view of the position over time.
 *
 * Heron's console has `LineChart`/`Spark`; neither is imported here. Those draw
 * against heron's private `--hc-*` tokens and its own tooltip chrome, and the
 * rest of `/farming-3` is deliberately in tasmil's token vocabulary. What is
 * carried over is the shape of the thing: a flat panel, one line, no gridlines
 * competing with it, the numbers stated as text above the plot rather than
 * decoded off an axis.
 *
 * Drawn by hand in SVG rather than with recharts. The reason is the tri-state
 * discipline the rest of this feature keeps: a chart library given an empty
 * array draws confident empty axes, and given a series of zeroes draws the same
 * picture as given nothing. Here those are five distinct renderings —
 * loading / unreadable / no snapshots / one snapshot / plotted — and the
 * decision lives in `seriesStatus`, not in a library's defaults.
 *
 * Coordinates are percentages, so the SVG (`viewBox="0 0 100 100"`,
 * `preserveAspectRatio="none"`) and the HTML hover overlay read the same
 * numbers. `vector-effect="non-scaling-stroke"` keeps the line one pixel wide
 * under that non-uniform scale.
 */

import { useCallback, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import type { ConsoleSnapshot } from "../types";
import {
  formatDayLabel,
  formatInstant,
  formatPercentPoints,
  formatSignedUsd,
  formatUsd,
} from "../utils/format";
import {
  buildSeriesGeometry,
  nearestIndex,
  type SeriesChange,
  type SeriesGeometry,
  type SeriesPoint,
  type SeriesStatus,
  seriesChange,
  seriesStatus,
  toSeriesPoints,
} from "../utils/series";
import { Chip, EmptyNote, Eyebrow, Hairline, Num, Panel } from "./console-ui";

/** Windows the backend accepts on `?days=`. */
export const HISTORY_WINDOWS = [7, 30, 90] as const;
export type HistoryWindow = (typeof HISTORY_WINDOWS)[number];

function changeToneClass(absolute: number): string {
  if (absolute > 0) return "text-emerald-400";
  if (absolute < 0) return "text-destructive";
  return "text-muted-foreground";
}

export interface PerformanceChartProps {
  /** `null` means the response was not a series — distinct from `[]`. */
  snapshots: ConsoleSnapshot[] | null | undefined;
  isLoading: boolean;
  /** Truthy when the query errored. */
  error?: unknown;
  days: HistoryWindow;
  onDaysChange: (days: HistoryWindow) => void;
  /** Where the snapshots are recorded. Shown so an empty series is explicable. */
  keeperAddress?: string;
  className?: string;
}

/** The headline number: whichever point the pointer is on, else the newest. */
function ChartHeadline({
  status,
  shown,
  hovering,
}: {
  status: SeriesStatus;
  shown: SeriesPoint | null;
  hovering: boolean;
}) {
  if (status === "loading") return <Skeleton className="h-7 w-28" />;
  if (!shown) {
    return (
      <span className="text-[15px] text-muted-foreground/60">
        {status === "unreadable" ? "History not readable" : "No snapshots yet"}
      </span>
    );
  }
  return (
    <>
      <Num
        className="font-semibold text-[26px] text-foreground leading-none tracking-tight"
        data-testid="farming3-chart-value"
      >
        {formatUsd(shown.value)}
      </Num>
      <span className="text-[11.5px] text-muted-foreground/80">
        {hovering ? formatInstant(shown.t) : `latest · ${formatInstant(shown.t)}`}
      </span>
    </>
  );
}

/** Change across the window, and the one case where no percentage exists. */
function ChartChange({ change, days }: { change: SeriesChange; days: HistoryWindow }) {
  return (
    <div className="mt-2 text-[12.5px]">
      <Num className={cn("font-medium", changeToneClass(change.absolute))}>
        {formatSignedUsd(change.absolute)}
      </Num>{" "}
      <span className="text-muted-foreground/80">
        {/* No percentage exists when the window opened at $0. Saying "0%" or
            "∞%" there would be inventing one. */}
        {change.percent === null
          ? `over ${days} days · started at ${formatUsd(change.first)}, so there is no percentage to quote`
          : `(${formatPercentPoints(change.percent)}) over ${days} days`}
      </span>
    </div>
  );
}

/**
 * The plot itself, rendered only for a series with at least two readable points.
 *
 * The pointer target is a plain box rather than an interactive control: it
 * reveals nothing that is not already written above the chart as text, so it
 * carries no keyboard obligation.
 */
function ChartPlot({
  geometry,
  marker,
  onPointerMove,
  onPointerLeave,
  label,
}: {
  geometry: SeriesGeometry;
  marker: { xPct: number; yPct: number } | null;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: () => void;
  label: string;
}) {
  const gradientId = useId();
  return (
    <div className="relative mt-4">
      <div
        className="relative h-[180px] w-full"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={label}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="text-primary">
            <path d={geometry.areaPath} fill={`url(#${gradientId})`} />
            <path
              d={geometry.linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>

        {/* Hover crosshair, in HTML so the non-uniform SVG scale cannot
            stretch it into an ellipse. */}
        {marker && (
          <>
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-border"
              style={{ left: `${marker.xPct}%` }}
            />
            <div
              className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute h-2 w-2 rounded-full bg-primary ring-2 ring-card"
              style={{ left: `${marker.xPct}%`, top: `${marker.yPct}%` }}
            />
          </>
        )}
      </div>

      {/* Axis extremes as text. Cheaper to read than tick marks, and they cannot
          disagree with the plotted domain. A flat series has one value, not two,
          and printing the same figure twice would imply a range it does not
          have — so it gets a single label, on the line. */}
      {geometry.high === geometry.low ? (
        <div className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-1 text-[10.5px] text-muted-foreground/60">
          <Num>{formatUsd(geometry.high)}</Num> flat
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute top-0 right-1 text-[10.5px] text-muted-foreground/60">
            <Num>{formatUsd(geometry.high)}</Num>
          </div>
          <div className="pointer-events-none absolute right-1 bottom-0 text-[10.5px] text-muted-foreground/60">
            <Num>{formatUsd(geometry.low)}</Num>
          </div>
        </>
      )}
    </div>
  );
}

/** The sentence shown instead of a plot, for each non-plottable outcome. */
function ChartNote({
  status,
  days,
  keeperAddress,
  latest,
}: {
  status: SeriesStatus;
  days: HistoryWindow;
  keeperAddress?: string;
  latest: SeriesPoint | null;
}) {
  if (status === "loading") {
    return <Skeleton className="mt-4 h-[180px] w-full rounded-xl" />;
  }
  if (status === "unreadable") {
    return (
      <EmptyNote>
        Could not read the value history. Your position is unaffected — this is the history read
        that failed, not the account.
      </EmptyNote>
    );
  }
  if (status === "empty") {
    return (
      <EmptyNote>
        No snapshots recorded for {keeperAddress ? "this keeper wallet" : "this account"} in the
        last {days} days. The snapshot job writes one every few minutes once the vault holds value.
      </EmptyNote>
    );
  }
  if (status === "single" && latest) {
    return (
      <EmptyNote>
        One snapshot so far, {formatUsd(latest.value)} at {formatInstant(latest.t)}. A line needs
        two.
      </EmptyNote>
    );
  }
  return null;
}

export function PerformanceChart({
  snapshots,
  isLoading,
  error,
  days,
  onDaysChange,
  keeperAddress,
  className,
}: PerformanceChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = useMemo(() => toSeriesPoints(snapshots), [snapshots]);
  // `snapshots === null` is the malformed-envelope case; both it and a query
  // error mean "we could not read this", which is not "there is nothing".
  const unreadable = Boolean(error) || snapshots === null;
  const status = seriesStatus(points, { loading: isLoading, unreadable });
  const geometry = useMemo(() => buildSeriesGeometry(points), [points]);
  const change = useMemo(() => seriesChange(points), [points]);

  const oldest = points.at(0) ?? null;
  const latest = points.at(-1) ?? null;
  const hovered = hoverIndex !== null ? (points[hoverIndex] ?? null) : null;
  const shown = hovered ?? latest;
  const marker = hoverIndex !== null ? (geometry.coords[hoverIndex] ?? null) : null;

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const box = event.currentTarget.getBoundingClientRect();
      if (box.width === 0) return;
      const index = nearestIndex(geometry.coords, (event.clientX - box.left) / box.width);
      setHoverIndex(index >= 0 ? index : null);
    },
    [geometry.coords]
  );

  const clearHover = useCallback(() => setHoverIndex(null), []);

  return (
    <Panel className={cn("p-4 sm:p-5", className)} data-testid="farming3-performance">
      <div className="flex flex-wrap items-start justify-between gap-3 px-1">
        <div>
          <Eyebrow>Managed value over time</Eyebrow>
          <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
            <ChartHeadline status={status} shown={shown} hovering={hovered !== null} />
          </div>
          {change && status === "ready" && <ChartChange change={change} days={days} />}
        </div>

        <div className="flex gap-1.5">
          {HISTORY_WINDOWS.map((window) => (
            <Chip
              key={window}
              active={window === days}
              onClick={() => onDaysChange(window)}
              className="px-3 py-1 text-[12px]"
            >
              {window}d
            </Chip>
          ))}
        </div>
      </div>

      <ChartNote status={status} days={days} keeperAddress={keeperAddress} latest={latest} />

      {status === "ready" && (
        <>
          <ChartPlot
            geometry={geometry}
            marker={marker}
            onPointerMove={onPointerMove}
            onPointerLeave={clearHover}
            label={`Managed value from ${formatDayLabel(oldest?.t)} to ${formatDayLabel(
              latest?.t
            )}, between ${formatUsd(geometry.low)} and ${formatUsd(geometry.high)}`}
          />

          <Hairline className="mt-3" />
          <div className="mt-2 flex items-baseline justify-between px-1 text-[11px] text-muted-foreground/70">
            <span>{formatDayLabel(oldest?.t)}</span>
            <span>
              {points.length} snapshots · wallet {formatUsd(shown?.walletUsd)} · deployed{" "}
              {formatUsd(shown?.defiUsd)}
            </span>
            <span>{formatDayLabel(latest?.t)}</span>
          </div>
        </>
      )}
    </Panel>
  );
}

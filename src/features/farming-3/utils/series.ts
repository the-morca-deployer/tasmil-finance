/**
 * Geometry for the console's performance chart.
 *
 * Pure functions, no React, no SVG strings that depend on a rendered width:
 * every coordinate is a PERCENTAGE of the plot box (0..100 on both axes, y
 * measured downwards like SVG). That lets one set of numbers drive both the SVG
 * path (`viewBox="0 0 100 100"`, `preserveAspectRatio="none"`) and the HTML
 * hover overlay, and makes the whole thing testable without a DOM.
 *
 * The honesty rules from `format.ts` apply here too, one level earlier:
 *
 *  - a snapshot with an unparseable timestamp or a non-finite value is DROPPED,
 *    not coerced to 0 / `Date.now()`. A point we cannot read is not a point at
 *    the origin.
 *  - `changePercent` is `null` when the first value is 0, because "grew from
 *    nothing" has no percentage. It is never reported as 0% or ∞.
 *  - a series that is entirely zero is still a series. It gets a real flat line
 *    and a real axis, which is what distinguishes "measured, and it was zero"
 *    from "we have no data".
 */

import type { ConsoleSnapshot } from "../types";

/** One readable snapshot. `t` is epoch ms; `value` is USD. */
export interface SeriesPoint {
  t: number;
  value: number;
  /** Money sitting in the keeper wallet, undeployed. */
  walletUsd: number;
  /** Money at work in strategies. */
  defiUsd: number;
}

/**
 * What the caller should render. Five outcomes, deliberately not four — a
 * one-point series cannot be drawn as a line but is not "no data" either.
 */
export type SeriesStatus = "loading" | "unreadable" | "empty" | "single" | "ready";

export interface SeriesGeometry {
  /** Plot coordinates, in the same order as `points`. */
  coords: { xPct: number; yPct: number }[];
  /** `M …` polyline through every point. Empty when fewer than two points. */
  linePath: string;
  /** The same line closed down to the baseline, for the fill. */
  areaPath: string;
  /** Domain actually plotted (after padding), so axis labels cannot lie. */
  yMin: number;
  yMax: number;
  /** Observed extremes, unpadded. */
  low: number;
  high: number;
}

/** Readable snapshots only, oldest first. */
export function toSeriesPoints(snapshots: ConsoleSnapshot[] | null | undefined): SeriesPoint[] {
  if (!snapshots) return [];
  const points: SeriesPoint[] = [];
  for (const snap of snapshots) {
    const t = new Date(snap?.timestamp ?? "").getTime();
    if (!Number.isFinite(t)) continue;
    if (typeof snap.totalValueUsd !== "number" || !Number.isFinite(snap.totalValueUsd)) continue;
    points.push({
      t,
      value: snap.totalValueUsd,
      walletUsd: Number.isFinite(snap.walletUsd) ? snap.walletUsd : 0,
      defiUsd: Number.isFinite(snap.defiUsd) ? snap.defiUsd : 0,
    });
  }
  points.sort((a, b) => a.t - b.t);
  return points;
}

export function seriesStatus(
  points: SeriesPoint[],
  opts: { loading: boolean; unreadable: boolean }
): SeriesStatus {
  if (opts.loading) return "loading";
  if (opts.unreadable) return "unreadable";
  if (points.length === 0) return "empty";
  if (points.length === 1) return "single";
  return "ready";
}

/**
 * Percentage-space geometry for a plottable series.
 *
 * A flat series (every value identical, zero included) is centred vertically
 * rather than collapsed onto an edge, and its axis labels report the one value
 * that was actually measured.
 */
export function buildSeriesGeometry(points: SeriesPoint[]): SeriesGeometry {
  const values = points.map((p) => p.value);
  const low = values.length > 0 ? Math.min(...values) : 0;
  const high = values.length > 0 ? Math.max(...values) : 0;

  // A flat line needs a domain with width, or every y collapses to 0/0.
  const flat = high - low < Number.EPSILON;
  const padding = flat ? Math.max(Math.abs(high) * 0.1, 1) : (high - low) * 0.12;
  const yMin = low - padding;
  const yMax = high + padding;

  const span = yMax - yMin;
  const firstPoint = points.at(0);
  const lastPoint = points.at(-1);
  const tFirst = firstPoint?.t ?? 0;
  const tSpan = firstPoint && lastPoint ? lastPoint.t - firstPoint.t : 0;

  const coords = points.map((p, i) => ({
    // All snapshots at the same instant (or a single point) sit at the left
    // edge rather than dividing by a zero time span.
    xPct:
      tSpan > 0
        ? ((p.t - tFirst) / tSpan) * 100
        : points.length > 1
          ? (i / (points.length - 1)) * 100
          : 0,
    yPct: 100 - ((p.value - yMin) / span) * 100,
  }));

  const head = coords.at(0);
  const tail = coords.at(-1);
  if (!head || !tail || coords.length < 2) {
    return { coords, linePath: "", areaPath: "", yMin, yMax, low, high };
  }

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.xPct.toFixed(3)},${c.yPct.toFixed(3)}`)
    .join(" ");
  const areaPath = `${linePath} L${tail.xPct.toFixed(3)},100 L${head.xPct.toFixed(3)},100 Z`;

  return { coords, linePath, areaPath, yMin, yMax, low, high };
}

export interface SeriesChange {
  first: number;
  last: number;
  absolute: number;
  /** `null` when the starting value was 0 — no percentage exists. */
  percent: number | null;
}

/** Change across the window. `null` when there is nothing to compare. */
export function seriesChange(points: SeriesPoint[]): SeriesChange | null {
  const head = points.at(0);
  const tail = points.at(-1);
  if (!head || !tail || points.length < 2) return null;
  const first = head.value;
  const last = tail.value;
  const absolute = last - first;
  return { first, last, absolute, percent: first === 0 ? null : (absolute / first) * 100 };
}

/** Index of the point nearest a horizontal position, given as 0..1 of the plot
 *  width. Used by the hover overlay. `-1` when there is nothing to hit. */
export function nearestIndex(coords: { xPct: number }[], fraction: number): number {
  if (coords.length === 0) return -1;
  const target = Math.min(Math.max(fraction, 0), 1) * 100;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const [i, coord] of coords.entries()) {
    const dist = Math.abs(coord.xPct - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

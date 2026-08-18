/**
 * The chart's honesty rules, as tests.
 *
 * Every case here is a way the previous `/farming` chart could have shown a
 * number nobody measured: a dropped snapshot rendered at the origin, a zero
 * baseline turned into a percentage, an all-zero series indistinguishable from
 * an empty one.
 */

import type { ConsoleSnapshot } from "../types";
import {
  buildSeriesGeometry,
  nearestIndex,
  seriesChange,
  seriesStatus,
  toSeriesPoints,
} from "./series";

function snap(
  timestamp: string,
  totalValueUsd: number,
  walletUsd = 0,
  defiUsd = 0
): ConsoleSnapshot {
  return { timestamp, totalValueUsd, walletUsd, defiUsd };
}

describe("toSeriesPoints", () => {
  it("returns an empty list for absent input rather than throwing", () => {
    expect(toSeriesPoints(undefined)).toEqual([]);
    expect(toSeriesPoints(null)).toEqual([]);
  });

  it("drops a snapshot with an unparseable timestamp instead of stamping it now", () => {
    const points = toSeriesPoints([snap("not-a-date", 10), snap("2026-08-17T00:00:00.000Z", 12)]);
    expect(points).toHaveLength(1);
    expect(points[0]?.value).toBe(12);
  });

  it("drops a snapshot whose value is not a finite number instead of reading it as 0", () => {
    const points = toSeriesPoints([
      {
        timestamp: "2026-08-17T00:00:00.000Z",
        totalValueUsd: Number.NaN,
        walletUsd: 0,
        defiUsd: 0,
      },
      snap("2026-08-17T01:00:00.000Z", 5),
    ]);
    expect(points).toHaveLength(1);
    expect(points[0]?.value).toBe(5);
  });

  it("keeps a measured zero — a value of 0 that was read is a fact", () => {
    expect(toSeriesPoints([snap("2026-08-17T00:00:00.000Z", 0)])).toHaveLength(1);
  });

  it("sorts oldest first regardless of the order the server sent", () => {
    const points = toSeriesPoints([
      snap("2026-08-17T02:00:00.000Z", 3),
      snap("2026-08-17T00:00:00.000Z", 1),
      snap("2026-08-17T01:00:00.000Z", 2),
    ]);
    expect(points.map((p) => p.value)).toEqual([1, 2, 3]);
  });
});

describe("seriesStatus", () => {
  const one = toSeriesPoints([snap("2026-08-17T00:00:00.000Z", 1)]);
  const two = toSeriesPoints([
    snap("2026-08-17T00:00:00.000Z", 1),
    snap("2026-08-17T01:00:00.000Z", 2),
  ]);

  it("prefers loading over every other verdict", () => {
    expect(seriesStatus([], { loading: true, unreadable: true })).toBe("loading");
  });

  it("distinguishes unreadable from empty", () => {
    expect(seriesStatus([], { loading: false, unreadable: true })).toBe("unreadable");
    expect(seriesStatus([], { loading: false, unreadable: false })).toBe("empty");
  });

  it("calls a one-point series 'single', not 'empty' and not 'ready'", () => {
    expect(seriesStatus(one, { loading: false, unreadable: false })).toBe("single");
  });

  it("is ready from two points up", () => {
    expect(seriesStatus(two, { loading: false, unreadable: false })).toBe("ready");
  });
});

describe("buildSeriesGeometry", () => {
  it("gives an all-zero series a real flat line rather than collapsing it", () => {
    const points = toSeriesPoints([
      snap("2026-08-17T00:00:00.000Z", 0),
      snap("2026-08-17T01:00:00.000Z", 0),
      snap("2026-08-17T02:00:00.000Z", 0),
    ]);
    const geometry = buildSeriesGeometry(points);

    expect(geometry.linePath).not.toBe("");
    expect(geometry.low).toBe(0);
    expect(geometry.high).toBe(0);
    // Every y identical and finite, centred rather than pinned to an edge.
    const ys = geometry.coords.map((c) => c.yPct);
    expect(ys.every((y) => Number.isFinite(y))).toBe(true);
    expect(new Set(ys).size).toBe(1);
    expect(ys[0]).toBeCloseTo(50, 5);
  });

  it("spreads x across the full width by time, ends included", () => {
    const points = toSeriesPoints([
      snap("2026-08-17T00:00:00.000Z", 1),
      snap("2026-08-17T00:30:00.000Z", 2),
      snap("2026-08-17T01:00:00.000Z", 3),
    ]);
    const { coords } = buildSeriesGeometry(points);
    expect(coords[0]?.xPct).toBeCloseTo(0, 5);
    expect(coords[1]?.xPct).toBeCloseTo(50, 5);
    expect(coords[2]?.xPct).toBeCloseTo(100, 5);
  });

  it("puts the highest value nearest the top of the plot", () => {
    const points = toSeriesPoints([
      snap("2026-08-17T00:00:00.000Z", 1),
      snap("2026-08-17T01:00:00.000Z", 9),
    ]);
    const { coords } = buildSeriesGeometry(points);
    expect(coords[1]?.yPct).toBeLessThan(coords[0]?.yPct ?? 0);
  });

  it("emits no path at all for fewer than two points", () => {
    const geometry = buildSeriesGeometry(toSeriesPoints([snap("2026-08-17T00:00:00.000Z", 4)]));
    expect(geometry.linePath).toBe("");
    expect(geometry.areaPath).toBe("");
  });

  it("does not divide by zero when every snapshot shares one instant", () => {
    const points = toSeriesPoints([
      snap("2026-08-17T00:00:00.000Z", 1),
      snap("2026-08-17T00:00:00.000Z", 2),
    ]);
    const { coords } = buildSeriesGeometry(points);
    expect(coords.every((c) => Number.isFinite(c.xPct))).toBe(true);
  });
});

describe("seriesChange", () => {
  it("has nothing to report for fewer than two points", () => {
    expect(seriesChange([])).toBeNull();
    expect(seriesChange(toSeriesPoints([snap("2026-08-17T00:00:00.000Z", 1)]))).toBeNull();
  });

  it("reports absolute change and percent when the window opened above zero", () => {
    const change = seriesChange(
      toSeriesPoints([snap("2026-08-17T00:00:00.000Z", 100), snap("2026-08-17T01:00:00.000Z", 110)])
    );
    expect(change?.absolute).toBeCloseTo(10, 8);
    expect(change?.percent).toBeCloseTo(10, 8);
  });

  it("returns a null percent — not 0, not Infinity — when the window opened at zero", () => {
    const change = seriesChange(
      toSeriesPoints([snap("2026-08-17T00:00:00.000Z", 0), snap("2026-08-17T01:00:00.000Z", 5)])
    );
    expect(change?.absolute).toBeCloseTo(5, 8);
    expect(change?.percent).toBeNull();
  });

  it("reports a measured zero change as 0, which is a real fact", () => {
    const change = seriesChange(
      toSeriesPoints([snap("2026-08-17T00:00:00.000Z", 7), snap("2026-08-17T01:00:00.000Z", 7)])
    );
    expect(change?.absolute).toBe(0);
    expect(change?.percent).toBe(0);
  });
});

describe("nearestIndex", () => {
  const coords = [{ xPct: 0 }, { xPct: 50 }, { xPct: 100 }];

  it("has no hit when there is nothing to hit", () => {
    expect(nearestIndex([], 0.5)).toBe(-1);
  });

  it("snaps to the closest point", () => {
    expect(nearestIndex(coords, 0)).toBe(0);
    expect(nearestIndex(coords, 0.49)).toBe(1);
    expect(nearestIndex(coords, 1)).toBe(2);
  });

  it("clamps a fraction outside the plot instead of indexing off the end", () => {
    expect(nearestIndex(coords, -3)).toBe(0);
    expect(nearestIndex(coords, 9)).toBe(2);
  });
});

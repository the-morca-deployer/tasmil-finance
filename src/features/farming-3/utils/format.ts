/**
 * Formatting for the `/farming-3` console.
 *
 * Two rules run through every function here, both of them scar tissue:
 *
 * 1. APY arrives as a DECIMAL FRACTION and is multiplied by 100 exactly once,
 *    here. Callers pass the raw backend number. `formatApy(0.067065)` is
 *    `"6.71%"`. Nothing else in the feature may do the multiply.
 *
 * 2. Absent is not zero. Every formatter takes `number | null | undefined` and
 *    returns `NO_DATA` for the absent case rather than a confident `$0.00` or
 *    `0.00%`. A measured zero still formats as `0.00%`, because a rate that was
 *    read and found to be zero is a real fact and must look different from a
 *    rate nobody could read.
 */

/** What an absent value looks like. Never a number, never blank. */
export const NO_DATA = "—";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function isMeasured(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** `1.5` → `"$1.50"`. `undefined` / `NaN` → `"—"`. */
export function formatUsd(value: number | null | undefined): string {
  return isMeasured(value) ? USD.format(value) : NO_DATA;
}

/**
 * Decimal fraction → percent string. THE multiply-by-100 lives here.
 * `0.067065` → `"6.71%"`; `0` → `"0.00%"`; `undefined` → `"—"`.
 */
export function formatApy(fraction: number | null | undefined, digits = 2): string {
  return isMeasured(fraction) ? `${(fraction * 100).toFixed(digits)}%` : NO_DATA;
}

/**
 * A value that is ALREADY a percent (backend `profitPercent` is `0.41` meaning
 * 0.41%, not 41%). Kept separate from `formatApy` so the two conventions can
 * never be confused at a call site.
 */
export function formatPercentPoints(percent: number | null | undefined, digits = 2): string {
  return isMeasured(percent) ? `${percent.toFixed(digits)}%` : NO_DATA;
}

/** Signed money, for P&L. `0` renders as `"$0.00"` with no sign. */
export function formatSignedUsd(value: number | null | undefined): string {
  if (!isMeasured(value)) return NO_DATA;
  const body = USD.format(Math.abs(value));
  if (value > 0) return `+${body}`;
  if (value < 0) return `-${body}`;
  return body;
}

/** Token amounts keep sub-unit precision: rounding 0.0004 to "0" reports
 *  nothing where money exists. */
export function formatAmount(value: number | null | undefined): string {
  if (!isMeasured(value)) return NO_DATA;
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  if (value !== 0 && Math.abs(value) < 1) {
    for (const places of [4, 6, 8]) {
      const s = value.toFixed(places);
      if (Number(s) !== 0) return s.replace(/0+$/, "").replace(/\.$/, "");
    }
    return value.toFixed(8);
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** `$120,540,233` → `"$120.5M"`. Absent stays absent. */
export function formatTvl(value: number | null | undefined): string {
  if (!isMeasured(value)) return NO_DATA;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return USD.format(value);
}

/** `"CDALQ…SL4"`. Empty input yields `NO_DATA`, never a stray ellipsis. */
export function shortAddress(address: string | null | undefined, edge = 4): string {
  if (!address) return NO_DATA;
  if (address.length <= edge * 2 + 1) return address;
  return `${address.slice(0, edge)}…${address.slice(-edge)}`;
}

/** `"da0a3f…689f"` for a 64-char tx hash. */
export function shortHash(hash: string | null | undefined): string {
  return shortAddress(hash, 6);
}

/**
 * A timestamp the backend actually sent.
 *
 * NEVER defaults to `new Date()`. A row with no `createdAt` is a row whose time
 * we do not know, and stamping it "now" invents a fact. Unparseable input is
 * treated the same as missing.
 */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return NO_DATA;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return NO_DATA;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Title-cases a backend SCREAMING_CASE token for display: `"BALANCED"` →
 *  `"Balanced"`, `"blend"` → `"Blend"`. Absent stays absent. */
export function titleCase(value: string | null | undefined): string {
  if (!value) return NO_DATA;
  return value
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

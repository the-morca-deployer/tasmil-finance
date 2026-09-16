/**
 * When a deposit is too small to be worth making.
 *
 * Depositing costs a fixed amount that does not shrink with the deposit: Blend
 * rounds the supplied amount down to its own share precision and keeps the
 * remainder. Measured on mainnet on 2026-08-17, that rounding consumed
 * 0.0001 USDC on a single deposit, while the resulting 1.5 USDC position
 * accrued 0.0000487 USDC over 4.4 hours at 6.5% APY - so the fixed cost was
 * worth roughly nine hours of yield, and the position spent most of its first
 * day paying for its own entry.
 *
 * Nothing here is a threshold on the amount. The amount alone cannot say
 * whether a deposit is uneconomic: 1.5 USDC at 0.06% APY is a far worse trade
 * than 1.5 USDC at 12%. What matters is how long the yield on THIS amount at
 * THIS rate takes to earn the fixed cost back, so that is what we compute.
 */

/**
 * The fixed cost of one deposit, in units of the deposited token.
 *
 * Measured against Blend on mainnet in USDC. It is deposit-rounding, not a
 * fee, so it does not scale with size and it is denominated in the token being
 * deposited - which is also the token the yield accrues in, so the two are
 * directly comparable without a price.
 */
export const DEPOSIT_ROUNDING_COST = 0.0001;

const HOURS_PER_YEAR = 8760;

/**
 * Hours of yield needed to earn the fixed deposit cost back.
 *
 * `null` when either input is unknown or non-positive - a missing rate is not
 * a zero rate, and "we cannot tell" must not render as "instant".
 */
export function hoursToEarnBackDepositCost(
  amount: number | null | undefined,
  apyFraction: number | null | undefined
): number | null {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
  if (typeof apyFraction !== "number" || !Number.isFinite(apyFraction) || apyFraction <= 0) {
    return null;
  }
  const yieldPerHour = (amount * apyFraction) / HOURS_PER_YEAR;
  if (yieldPerHour <= 0) return null;
  return DEPOSIT_ROUNDING_COST / yieldPerHour;
}

/**
 * Where "small" starts: six hours, i.e. the fixed cost eating more than a
 * quarter of the deposit's first day of yield. Below that the entry cost is a
 * rounding error on the first day; above it, it is the first day.
 */
export const UNECONOMIC_HOURS = 6;

/** True when the fixed cost dominates the early yield at this size and rate. */
export function isDepositUneconomic(
  amount: number | null | undefined,
  apyFraction: number | null | undefined
): boolean {
  const hours = hoursToEarnBackDepositCost(amount, apyFraction);
  return hours !== null && hours > UNECONOMIC_HOURS;
}

/**
 * The break-even time, phrased for a person: `"about 9 hours"`, `"about 3
 * days"`. Absent input yields `null` so the caller renders nothing rather than
 * an invented duration.
 */
export function formatEarnBackTime(hours: number | null): string | null {
  if (hours === null || !Number.isFinite(hours) || hours <= 0) return null;
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60));
    return `about ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  if (hours < 48) {
    const rounded = Math.round(hours);
    return `about ${rounded} hour${rounded === 1 ? "" : "s"}`;
  }
  const days = Math.round(hours / 24);
  return `about ${days} day${days === 1 ? "" : "s"}`;
}

/**
 * The smallest deposit at this rate whose fixed cost is earned back inside
 * `UNECONOMIC_HOURS`. Shown so the note names a size instead of only a
 * problem. `null` when the rate is unknown.
 */
export function economicAmountAt(apyFraction: number | null | undefined): number | null {
  if (typeof apyFraction !== "number" || !Number.isFinite(apyFraction) || apyFraction <= 0) {
    return null;
  }
  return (DEPOSIT_ROUNDING_COST * HOURS_PER_YEAR) / (UNECONOMIC_HOURS * apyFraction);
}

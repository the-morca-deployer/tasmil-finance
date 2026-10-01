/**
 * Display helpers for the on-chain rulebook. The contract stores amounts in
 * token base units and time in ledgers; these turn them into something a user
 * can read while the raw values stay on screen for Stellar.expert comparison.
 */

export const TOKEN_DECIMALS = 7;

/** Average Stellar ledger close time, used only for approximate durations. */
const SECONDS_PER_LEDGER = 5;

// Stellar Asset Contract ids for assets the vault policy can reference.
const KNOWN_ASSET_CONTRACTS: Record<string, string> = {
  CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA: "XLM", // mainnet native
  CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC: "XLM", // testnet native
  CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75: "USDC", // mainnet Circle USDC
};

const CONTRACT_ID = /^C[A-Z2-7]{55}$/;

/** Ticker for a policy asset: known SAC id -> symbol, plain symbols pass through, else null. */
export function assetSymbol(asset: string): string | null {
  if (KNOWN_ASSET_CONTRACTS[asset]) return KNOWN_ASSET_CONTRACTS[asset];
  return CONTRACT_ID.test(asset) ? null : asset;
}

export function shortAddress(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 4)}...${value.slice(-4)}`;
}

/** Base units -> grouped decimal string without trailing zeros, e.g. "100000000" -> "10". */
export function formatTokenAmount(raw: string, decimals = TOKEN_DECIMALS): string {
  const digits = raw.replace(/^0+(?=\d)/, "");
  const padded = digits.padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals);
  const fraction = padded.slice(padded.length - decimals).replace(/0+$/, "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

/** Rough human duration for a ledger count, e.g. 515050 -> "~30 days". */
export function ledgersToDuration(ledgers: bigint): string {
  if (ledgers <= 0n) return "now";
  const seconds = Number(ledgers) * SECONDS_PER_LEDGER;
  const units: Array<[number, string]> = [
    [86_400, "day"],
    [3_600, "hour"],
    [60, "min"],
  ];
  for (const [size, label] of units) {
    if (seconds >= size) {
      const n = Math.round(seconds / size);
      return `~${n} ${label}${n === 1 || label === "min" ? "" : "s"}`;
    }
  }
  return `~${seconds} sec`;
}

/** Share of a limit used, clamped to 0..100; 0 when the limit is zero. */
export function usedPercent(used: string, limit: string): number {
  const max = BigInt(limit);
  if (max === 0n) return 0;
  const pct = Number((BigInt(used) * 10_000n) / max) / 100;
  return Math.min(100, Math.max(0, pct));
}

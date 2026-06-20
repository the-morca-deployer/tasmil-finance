/**
 * Convert Stellar stroops (1 XLM = 10^7 stroops) to a human XLM string.
 * Uses BigInt math to avoid Number precision loss at large values.
 */
export function stroopsToXlm(stroops: bigint | string, fractionDigits = 3): string {
  const s = typeof stroops === "bigint" ? stroops : BigInt(stroops);
  const sign = s < 0n ? "-" : "";
  const abs = s < 0n ? -s : s;
  const STROOPS_PER_XLM = 10_000_000n;
  const whole = abs / STROOPS_PER_XLM;
  const frac = abs % STROOPS_PER_XLM;
  const fracPadded = frac.toString().padStart(7, "0");
  const fracTrimmed = fracPadded.slice(0, fractionDigits);
  return `${sign}${whole.toString()}.${fracTrimmed}`;
}

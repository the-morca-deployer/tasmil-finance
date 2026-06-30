const PENDING_KEY = "tasmil.referral.pendingCode";

/**
 * Returns the base origin for share links, in priority order:
 *  1. NEXT_PUBLIC_APP_URL (explicit config — set in all environments)
 *  2. window.location.origin (browser client calls, e.g. click handlers)
 *  3. Hard-coded production origin as SSR/unknown-environment fallback
 */
function getShareOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "https://app.tasmil-finance.xyz";
}

export function buildShareUrl(code: string): string {
  return `${getShareOrigin()}/r/${code}`;
}

export function readPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  const fromQuery = new URLSearchParams(window.location.search).get("ref");
  if (fromQuery) return fromQuery;
  try {
    return window.localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

/**
 * Remove the stored pending referral code after a successful wallet verify.
 * SSR-safe and never throws.
 */
export function clearPendingReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore – e.g. storage access blocked
  }
}

/**
 * Build the payload for the /api/auth/verify POST.
 * Pure function — extracted so the referredByCode merging logic can be unit-tested
 * without driving the full wallet-context harness.
 */
export function buildVerifyPayload(
  publicKey: string,
  signedMessage: string,
  referredByCode: string | null
): Record<string, unknown> {
  return {
    publicKey,
    signedMessage,
    ...(referredByCode ? { referredByCode } : {}),
  };
}

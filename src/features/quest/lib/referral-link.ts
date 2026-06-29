const PENDING_KEY = "tasmil.referral.pendingCode";
const SHARE_BASE = "https://tasmil.finance/r";

export function buildShareUrl(code: string): string {
  return `${SHARE_BASE}/${code}`;
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
 * Build the payload for the /api/auth/verify POST.
 * Pure function — extracted so the referredByCode merging logic can be unit-tested
 * without driving the full wallet-context harness.
 */
export function buildVerifyPayload(
  publicKey: string,
  signedMessage: string,
  referredByCode: string | null,
): Record<string, unknown> {
  return {
    publicKey,
    signedMessage,
    ...(referredByCode ? { referredByCode } : {}),
  };
}

const PENDING_KEY = "tasmil.referral.pendingCode";

export function buildShareUrl(code: string): string {
  // Always use the domain the user is currently on - never .env or a hard-coded
  // host. Share links are built inside click handlers, so window is defined; the
  // empty-origin branch only guards SSR (where this is never actually called).
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/r/${code}`;
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
    // ignore - e.g. storage access blocked
  }
}

/**
 * Build the payload for the /api/auth/verify POST.
 * Pure function - extracted so the referredByCode merging logic can be unit-tested
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

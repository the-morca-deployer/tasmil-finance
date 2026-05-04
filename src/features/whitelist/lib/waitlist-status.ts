/**
 * Shared status helpers for the wallet-first waitlist.
 * Centralizes small status checks so components don't repeat conditional logic.
 */

export interface WaitlistWalletStatusData {
  hasEmail: boolean;
  emailDeliveryEligible: boolean;
  referralCode: string;
  successfulReferralCount: number;
  queueRank: number;
  totalEntries: number;
}

/**
 * Returns true if the wallet entry has an email attached.
 */
export function hasContactEmail(status: WaitlistWalletStatusData | null | undefined): boolean {
  return !!status?.hasEmail;
}

/**
 * Returns true if the wallet entry is eligible for email-based access code delivery.
 * Currently equivalent to hasEmail, but reserved for future logic (e.g., verified emails).
 */
export function isEmailDeliveryEligible(
  status: WaitlistWalletStatusData | null | undefined
): boolean {
  return !!status?.emailDeliveryEligible;
}

/**
 * Returns a human-readable description of the waitlist position.
 */
export function getWaitlistPosition(status: WaitlistWalletStatusData | null | undefined): string {
  if (!status) return "Unknown";
  return `#${status.queueRank} of ${status.totalEntries} wallets`;
}

/**
 * Returns true if the user has any referrals.
 */
export function hasReferrals(status: WaitlistWalletStatusData | null | undefined): boolean {
  return (status?.successfulReferralCount ?? 0) > 0;
}

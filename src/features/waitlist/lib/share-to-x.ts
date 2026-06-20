export function buildReferralUrl(referralCode: string | undefined): string | undefined {
  if (!referralCode) return undefined;
  const base = typeof window !== "undefined" ? window.location.origin : "https://tasmil.finance";
  return `${base}/waitlist?ref=${referralCode}`;
}

export function buildXShareText(referralUrl: string): string {
  return `Just joined the @TasmilFinance waitlist — autonomous DeFi yield on Stellar.\n\nJoin with my link: ${referralUrl}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function openXShare(text: string): void {
  const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Google Analytics helpers via gtag.
 *
 * Page views are auto-tracked by @next/third-parties/google.
 * Use `trackEvent` for custom actions like wallet connect, swap, deposit, etc.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Track a custom GA4 event. No-ops if gtag is not loaded.
 *
 * @example
 * trackEvent("wallet_connect", { provider: "freighter" });
 * trackEvent("swap_execute", { from: "XLM", to: "USDC", agent: "soroswap_agent" });
 * trackEvent("agent_chat_start", { agent: "blend_agent" });
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}

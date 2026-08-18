// Single source of truth for the waitlist on/off mode.
//
// ON  (NEXT_PUBLIC_WAITLIST_MODE=true):  /waitlist + /access live, access code
//     required, the proxy gate sends unauthenticated users back to "/".
// OFF (anything else): no /waitlist, no /access, no access code - app routes are
//     open and the wallet is connected in-app.
//
// Read both server-side (proxy) and client-side (auth-bootstrap, landing CTAs).
// NEXT_PUBLIC_* is inlined at build, so flipping the flag needs a restart/redeploy.

/** Where /waitlist + /access redirect to (and the "Launch App" CTA target). */
export const APP_ENTRY = "/chat";

export function isWaitlistMode(): boolean {
  return process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";
}

// Routes that never require authentication, in either mode.
const PUBLIC_PATHS = ["/waitlist", "/access", "/r"];

/** True for routes that should never be gated / redirected on a 401. */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Framework + api prefixes the auth gate must never touch.
const ASSET_PREFIXES = ["/_next", "/api", "/images"];

/** True for framework/api paths and any static asset file (has an extension). */
export function isStaticAsset(pathname: string): boolean {
  if (pathname === "/favicon.ico" || pathname === "/robots.txt") return true;
  if (ASSET_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  // Public asset files like /tasmil-logo.png, /partners/blend.svg, /tokens/usdc.svg
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

const matches = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export interface GateInput {
  pathname: string;
  hasAuthCookie: boolean;
  /** Dev-bypass active (NEXT_PUBLIC_DEV_BYPASS_AUTH) - skips the auth gate. */
  devBypass: boolean;
}

/**
 * Route-gate decision based on waitlist mode + auth. Returns a redirect target
 * path, or null to let the request through. Pure - the proxy adapter turns the
 * result into a NextResponse.
 */
export function gateDecision({ pathname, hasAuthCookie, devBypass }: GateInput): string | null {
  // Never gate framework/api/assets, the landing root, or self-gated areas.
  if (
    isStaticAsset(pathname) ||
    pathname === "/" ||
    matches(pathname, "/admin") ||
    matches(pathname, "/quest")
  ) {
    return null;
  }

  if (!isWaitlistMode()) {
    // OFF: the waitlist funnel doesn't exist - send those routes to the app;
    // everything else is open (wallet connects in-app).
    if (matches(pathname, "/waitlist") || matches(pathname, "/access")) {
      return APP_ENTRY;
    }
    return null;
  }

  // ON: /waitlist + /access are the public entry points; gate the rest behind
  // the auth cookie (dev-bypass skips the gate).
  if (isPublicPath(pathname)) return null;
  if (devBypass) return null;
  return hasAuthCookie ? null : "/";
}

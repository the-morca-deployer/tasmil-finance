import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/whitelist", "/admin", "/api", "/_next", "/favicon.ico", "/robots.txt", "/images"];
const ADMIN_PATH_PREFIX = "/admin";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and whitelisted paths
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images")
  ) {
    // Redirect root to whitelist
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/whitelist", request.url));
    }
    return NextResponse.next();
  }

  // Admin paths are protected by their own auth, don't redirect
  if (pathname.startsWith(ADMIN_PATH_PREFIX)) {
    return NextResponse.next();
  }

  // All other paths redirect to whitelist during prelaunch
  // This can be relaxed later when the product is live
  if (!pathname.startsWith("/whitelist")) {
    return NextResponse.redirect(new URL("/whitelist", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
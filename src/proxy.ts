import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/waitlist", "/api", "/_next", "/favicon.ico", "/robots.txt", "/images"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Admin paths are handled client-side by AdminAuthGuard — no server redirect needed
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Faucet: testnet only
  const isTestnet = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] === "testnet";
  if ((pathname === "/faucet" || pathname.startsWith("/faucet/")) && !isTestnet) {
    return NextResponse.redirect(new URL("/agents", request.url));
  }

  // Playground, aggregator, dev: development only
  const isDev = process.env["NEXT_PUBLIC_APP_ENV"] === "development";
  const isDevOnly =
    pathname === "/playground" || pathname.startsWith("/playground/") ||
    pathname === "/aggregator" || pathname.startsWith("/aggregator/") ||
    pathname === "/dev" || pathname.startsWith("/dev/");

  if (isDevOnly && !isDev) {
    return NextResponse.redirect(new URL("/agents", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};

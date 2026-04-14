import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/waitlist", "/api", "/_next", "/favicon.ico", "/robots.txt", "/images"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images")
  ) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/waitlist", request.url));
    }
    return NextResponse.next();
  }

  // Admin paths are handled client-side by AdminAuthGuard — no server redirect needed
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // All other paths redirect to waitlist during prelaunch
  if (!pathname.startsWith("/waitlist")) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};

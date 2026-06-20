import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { gateDecision } from "@/lib/waitlist-mode";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Waitlist-mode + auth gate (pure decision, unit-tested in waitlist-mode.test.ts):
  //  - OFF: /waitlist + /access -> app entry; app routes open.
  //  - ON:  /waitlist + /access public; other routes require the auth cookie.
  //  - assets / api / _next / admin / quest / root always pass.
  const devBypass =
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true" &&
    process.env.NEXT_PUBLIC_APP_ENV !== "production";
  const hasAuthCookie = Boolean(request.cookies.get("tasmil_auth")?.value);

  const redirectTo = gateDecision({ pathname, hasAuthCookie, devBypass });
  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Faucet: testnet only
  const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "testnet";
  if ((pathname === "/faucet" || pathname.startsWith("/faucet/")) && !isTestnet) {
    return NextResponse.redirect(new URL("/chat/new", request.url));
  }

  // Playground + dev: development only.
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === "development";
  const isDevOnly =
    pathname === "/playground" ||
    pathname.startsWith("/playground/") ||
    pathname === "/dev" ||
    pathname.startsWith("/dev/");
  if (isDevOnly && !isDev) {
    return NextResponse.redirect(new URL("/chat/new", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};

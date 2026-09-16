import { type NextRequest, NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  requireEnv("BACKEND_INTERNAL_URL", "http://localhost:6756");

function unwrap<T>(payload: T | { success?: boolean; data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) return payload.data as T;
  return payload as T;
}

/**
 * Credentials the caller sent us, passed straight through.
 *
 * `GET /api/portfolio/history/:address` is guarded on the backend. This route
 * used to forward the request with no credentials at all, so every call came
 * back 401 no matter how the browser was authenticated — and callers that treat
 * a non-2xx as "no history" then showed an empty chart instead of an error. Only
 * headers the client actually sent are forwarded; nothing is minted here.
 */
function forwardedAuth(request: NextRequest): HeadersInit {
  const headers: Record<string, string> = {};
  const authorization = request.headers.get("authorization");
  if (authorization) headers.authorization = authorization;
  const cookie = request.headers.get("cookie");
  if (cookie) headers.cookie = cookie;
  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const days = request.nextUrl.searchParams.get("days") ?? "30";
    const response = await fetch(
      `${BACKEND_URL}/api/portfolio/history/${encodeURIComponent(address)}?days=${days}`,
      { headers: forwardedAuth(request) }
    );
    const data = await response.json();
    return NextResponse.json(unwrap(data), { status: response.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}

import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://backend.tasmil-finance.xyz";

function unwrapBackendResponse<T>(payload: T | { success?: boolean; data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json({ message: "walletAddress required" }, { status: 400 });
    }

    const response = await fetch(
      `${BACKEND_URL}/api/waitlist/status?walletAddress=${encodeURIComponent(walletAddress)}`
    );
    const data = await response.json();
    return NextResponse.json(unwrapBackendResponse(data), { status: response.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}

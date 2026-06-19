import { type NextRequest, NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  requireEnv("BACKEND_INTERNAL_URL", "http://localhost:6756");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendRes = await fetch(`${BACKEND_URL}/api/waitlist/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const error = await backendRes.json();
      return NextResponse.json(error, { status: backendRes.status });
    }

    const data = await backendRes.json();
    const accessToken = (data.data ?? data)?.accessToken ?? data.accessToken;

    const response = NextResponse.json({ success: true });
    if (accessToken) {
      response.cookies.set("tasmil_auth", accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }
    return response;
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}

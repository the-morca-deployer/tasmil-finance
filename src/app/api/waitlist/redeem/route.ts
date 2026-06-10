import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerBackendBaseUrl } from "@/lib/runtime-urls";

const BACKEND_URL = getServerBackendBaseUrl();

export async function POST(request: NextRequest) {
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
  const { accessToken } = data;

  const response = NextResponse.json({ success: true });
  response.cookies.set("tasmil_access", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

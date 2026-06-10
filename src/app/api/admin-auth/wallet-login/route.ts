import { type NextRequest, NextResponse } from "next/server";
import { getServerBackendBaseUrl } from "@/lib/runtime-urls";

const BACKEND_URL = getServerBackendBaseUrl();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${BACKEND_URL}/api/admin-auth/wallet-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const response = NextResponse.json(data, { status: res.status });
  if (res.ok && data.accessToken) {
    response.cookies.set("tasmil_admin", data.accessToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    });
  }
  return response;
}

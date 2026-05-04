import { type NextRequest, NextResponse } from "next/server";
import { getServerBackendBaseUrl } from "@/lib/runtime-urls";

const BACKEND_URL = getServerBackendBaseUrl();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/admin-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, message: "Service unavailable" }, { status: 503 });
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:6756";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tasmil_auth")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, statusCode: 401, message: "No token provided", error: "Unauthorized" },
      { status: 401 },
    );
  }

  const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}

import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:6756";

function getAdminToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  const token = getAdminToken(request);
  if (!token) return NextResponse.json({ message: "No admin token" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const qs = new URLSearchParams();
  for (const key of ["page", "limit", "status", "search"]) {
    const val = searchParams.get(key);
    if (val) qs.set(key, val);
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/waitlist/entries?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}

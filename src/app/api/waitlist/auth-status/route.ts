import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("tasmil_auth")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return NextResponse.json({ authenticated: false });

    const payload = JSON.parse(Buffer.from(parts[1] ?? "", "base64url").toString("utf8"));

    return NextResponse.json({
      authenticated: true,
      walletAddress: payload.walletAddress ?? null,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

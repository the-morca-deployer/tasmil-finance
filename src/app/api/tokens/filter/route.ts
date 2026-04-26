import { NextRequest, NextResponse } from "next/server";
import { sdk, ensureBridgeTokens } from "../../aggregator/_sdk";

export async function POST(req: NextRequest) {
  try {
    await ensureBridgeTokens();
    const body = await req.json();
    return NextResponse.json(sdk.tokens.filter(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Filter failed" },
      { status: 400 },
    );
  }
}

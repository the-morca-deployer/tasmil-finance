import { NextResponse } from "next/server";
import { sdk, ensureBridgeTokens } from "../aggregator/_sdk";

export async function GET() {
  await ensureBridgeTokens();
  return NextResponse.json(sdk.tokens.getRegistry());
}

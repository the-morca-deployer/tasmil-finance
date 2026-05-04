import { NextResponse } from "next/server";
import { sdk } from "../../aggregator/_sdk";

export async function POST(req: Request) {
  try {
    const { address, assetCode } = await req.json();
    if (!address || !assetCode) {
      return NextResponse.json({ hasTrustline: false, error: "Missing params" });
    }
    const result = await sdk.stellar.checkTrustline(address, assetCode);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ hasTrustline: false });
  }
}

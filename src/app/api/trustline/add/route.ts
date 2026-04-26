import { NextResponse } from "next/server";
import { sdk } from "../../aggregator/_sdk";

export async function POST(req: Request) {
  try {
    const { address, assetCode, assetIssuer } = await req.json();
    if (!address || !assetCode) {
      return NextResponse.json({ error: "address and assetCode required" }, { status: 400 });
    }
    const result = await sdk.stellar.buildTrustlineXdr(address, assetCode, assetIssuer);
    return NextResponse.json({ success: true, xdr: result.xdr });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Build trustline failed" },
      { status: 500 },
    );
  }
}

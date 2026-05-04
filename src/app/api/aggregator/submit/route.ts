import { NextResponse } from "next/server";
import { sdk } from "../_sdk";

export async function POST(req: Request) {
  try {
    const { signedXdr } = await req.json();
    if (!signedXdr) {
      return NextResponse.json({ success: false, error: "signedXdr is required" }, { status: 400 });
    }
    const result = await sdk.stellar.submitTransaction(signedXdr);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

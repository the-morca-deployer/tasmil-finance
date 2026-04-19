import { NextRequest } from "next/server";
import { getClient, isValidProtocol, jsonError, getNetwork } from "../../_sdk";

const SUPPORTS_QUOTE = new Set(["aquarius", "soroswap", "phoenix", "sdex", "allbridge", "templar"]);

export async function GET(req: NextRequest, { params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;
  if (!isValidProtocol(protocol)) return jsonError(`Unknown protocol: ${protocol}`, 404);
  if (!SUPPORTS_QUOTE.has(protocol)) return jsonError(`${protocol} does not support quotes`);

  const tokenIn = req.nextUrl.searchParams.get("tokenIn") ?? "";
  const tokenOut = req.nextUrl.searchParams.get("tokenOut") ?? "";
  const amount = req.nextUrl.searchParams.get("amount") ?? "";

  if (!tokenIn || !tokenOut || !amount) {
    return jsonError("tokenIn, tokenOut, and amount parameters required");
  }

  try {
    const sdk = getClient();
    const network = getNetwork();

    if (protocol === "sdex") {
      const paths = await sdk.sdex.findStrictSendPaths(tokenIn, amount, [tokenOut]);
      return Response.json({ success: true, network, protocol, paths });
    }

    // Use the swap adapter interface for protocols that support getAdapterQuote
    const adapter = sdk[protocol] as { getAdapterQuote?: (p: unknown) => Promise<unknown> };
    if (typeof adapter.getAdapterQuote === "function") {
      const quote = await adapter.getAdapterQuote({ tokenIn, tokenOut, amount });
      return Response.json({ success: true, network, protocol, quote });
    }

    return jsonError(`${protocol} quote not implemented`);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch quote", 500);
  }
}

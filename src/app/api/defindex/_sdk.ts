import { createTasmilClient } from "@tasmil/adapter-sdk";
import { STELLAR_NETWORK } from "@/shared/config/stellar-server";

export function getDefindexClient() {
  return createTasmilClient({
    network: STELLAR_NETWORK,
    defindexApiUrl: process.env["DEFINDEX_API_URL"],
    defindexApiKey: process.env["DEFINDEX_API_KEY"],
  });
}

export function getNetwork() { return STELLAR_NETWORK; }

export function jsonError(msg: string, status = 400) {
  return Response.json({ success: false, error: msg }, { status });
}

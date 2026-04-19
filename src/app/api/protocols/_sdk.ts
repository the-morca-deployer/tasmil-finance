import { createTasmilClient, type TasmilClient } from "@tasmil/adapter-sdk";

function getNetwork(): "mainnet" | "testnet" {
  const raw =
    process.env["NEXT_PUBLIC_STELLAR_NETWORK"] ??
    process.env["STELLAR_NETWORK"] ??
    "mainnet";
  return raw.toLowerCase().includes("test") ? "testnet" : "mainnet";
}

let _cached: TasmilClient | null = null;
let _cachedNetwork: string | null = null;

export function getClient(): TasmilClient {
  const network = getNetwork();
  if (_cached && _cachedNetwork === network) return _cached;
  _cached = createTasmilClient({
    network,
    rpcUrl: process.env["STELLAR_RPC_URL"],
    horizonUrl: process.env["STELLAR_HORIZON_URL"],
    soroswapApiKeys: process.env["SOROSWAP_API_KEYS"] ?? process.env["SOROSWAP_API_KEY"],
  });
  _cachedNetwork = network;
  return _cached;
}

export const VALID_PROTOCOLS = [
  "blend", "aquarius", "soroswap", "phoenix", "sdex", "allbridge", "defindex", "templar",
] as const;
export type ProtocolId = (typeof VALID_PROTOCOLS)[number];

export function isValidProtocol(p: string): p is ProtocolId {
  return (VALID_PROTOCOLS as readonly string[]).includes(p);
}

export function getExplorerUrl(contract: string): string {
  const network = getNetwork();
  const base = network === "testnet"
    ? "https://stellar.expert/explorer/testnet/contract"
    : "https://stellar.expert/explorer/public/contract";
  return `${base}/${contract}`;
}

export function jsonError(msg: string, status = 400) {
  return Response.json({ success: false, error: msg }, { status });
}

export { getNetwork };

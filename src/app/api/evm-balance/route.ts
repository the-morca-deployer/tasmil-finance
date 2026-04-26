import { NextResponse } from "next/server";

const CHAIN_RPC: Record<string, string> = {
  ethereum: "https://ethereum-rpc.publicnode.com",
  bsc: "https://bsc-rpc.publicnode.com",
  polygon: "https://polygon-bor-rpc.publicnode.com",
  arbitrum: "https://arbitrum-one-rpc.publicnode.com",
  optimism: "https://optimism-rpc.publicnode.com",
  avalanche: "https://avalanche-c-chain-rpc.publicnode.com",
  base: "https://base-rpc.publicnode.com",
  celo: "https://celo-rpc.publicnode.com",
  linea: "https://linea-rpc.publicnode.com",
};

// ERC-20 balanceOf(address) selector: 0x70a08231
const BALANCE_OF_SELECTOR = "0x70a08231";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const token = searchParams.get("token");
  const chain = searchParams.get("chain");
  const decimals = parseInt(searchParams.get("decimals") || "18", 10);

  if (!wallet || !token || !chain) {
    return NextResponse.json({ balance: 0, error: "Missing wallet, token, or chain" });
  }

  const rpc = CHAIN_RPC[chain];
  if (!rpc) {
    return NextResponse.json({ balance: 0, error: `Unsupported chain: ${chain}` });
  }

  try {
    // Encode balanceOf(wallet) call data
    const paddedAddress = wallet.slice(2).toLowerCase().padStart(64, "0");
    const data = `${BALANCE_OF_SELECTOR}${paddedAddress}`;

    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: token, data }, "latest"],
      }),
    });

    if (!res.ok) return NextResponse.json({ balance: 0 });

    const json = await res.json();
    if (json.error) return NextResponse.json({ balance: 0 });

    const rawBalance = BigInt(json.result || "0x0");
    const balance = Number(rawBalance) / 10 ** decimals;

    return NextResponse.json({ balance });
  } catch {
    return NextResponse.json({ balance: 0 });
  }
}

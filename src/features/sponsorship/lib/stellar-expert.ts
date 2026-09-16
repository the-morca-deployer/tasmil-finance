const BASE: Record<"mainnet" | "testnet", string> = {
  mainnet: "https://stellar.expert/explorer/public",
  testnet: "https://stellar.expert/explorer/testnet",
};

export function txExplorerUrl(network: "mainnet" | "testnet", hash: string): string {
  return `${BASE[network]}/tx/${hash}`;
}

export function truncateHash(hash: string, head = 4, tail = 4): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

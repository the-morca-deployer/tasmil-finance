// src/features/quest/lib/stellar.ts
export const STELLAR_NETWORKS = {
  PUBLIC: {
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    horizonUrl: "https://horizon.stellar.org",
  },
  TESTNET: {
    networkPassphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
  },
} as const;

export const activeNetwork =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? STELLAR_NETWORKS.PUBLIC
    : STELLAR_NETWORKS.TESTNET;

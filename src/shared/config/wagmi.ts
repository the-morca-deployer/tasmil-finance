import { getDefaultConfig, type WalletList } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, okxWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { defineChain } from "viem";
import { http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

// Local Anvil Chain (Arbitrum Fork)
const localAnvil = defineChain({
  id: 31337, // Use standard Anvil chain ID instead of Arbitrum's
  name: "Arbitrum Fork (Local)",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "Local Explorer",
      url: "http://localhost:3000",
    },
  },
  testnet: true,
  iconUrl: "https://raw.githubusercontent.com/foundry-rs/foundry/master/media/foundry_logo.svg",
  iconBackground: "#000000",
});

// U2U Solaris Mainnet
const u2uSolaris = defineChain({
  id: 39,
  name: "U2U Network Solaris",
  nativeCurrency: {
    decimals: 18,
    name: "U2U",
    symbol: "U2U",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-mainnet.u2u.xyz"],
      webSocket: ["wss://ws-mainnet.u2u.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "U2U Explorer",
      url: "https://u2uscan.xyz",
    },
  },
  testnet: false,
  iconUrl: "https://s2.coinmarketcap.com/static/img/coins/128x128/27369.png",
  iconBackground: "#1e293b",
});

const wallets: WalletList = [
  {
    groupName: "Popular",
    wallets: [metaMaskWallet, okxWallet, walletConnectWallet],
  },
];

const metadata = {
  name: "Tasmil Finance",
  projectId: process.env["NEXT_PUBLIC_PROJECT_ID"] || "",
};

// Determine which config to use based on environment
const useLocalChain = process.env["NEXT_PUBLIC_USE_LOCAL_CHAIN"] === "true";

// Create separate configs for local and mainnet
const localConfig = getDefaultConfig({
  appName: metadata.name,
  projectId: metadata.projectId,
  chains: [localAnvil],
  transports: {
    [localAnvil.id]: http(),
  },
  ssr: true,
  wallets,
});

const mainnetConfig = getDefaultConfig({
  appName: metadata.name,
  projectId: metadata.projectId,
  chains: [sepolia, u2uSolaris, mainnet],
  transports: {
    [sepolia.id]: http(),
    [u2uSolaris.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
  wallets,
});

export const wagmiConfig = useLocalChain ? localConfig : mainnetConfig;
export const chains = useLocalChain ? [localAnvil] : [sepolia, u2uSolaris, mainnet];
export const defaultNetwork = useLocalChain ? localAnvil : sepolia;

// Helper to get the target chain based on environment
export const getTargetChain = () => {
  return useLocalChain ? localAnvil : sepolia;
};

// Helper to check if we're on the correct chain
export const isCorrectChain = (chainId: number) => {
  const targetChain = getTargetChain();
  return chainId === targetChain.id;
};

// Stub for @wagmi/core Tempo Wallet "accounts" dependency.
// This module is dynamically imported but never used in our app — we only use
// WagmiAdapter with standard EVM networks. Providing this stub prevents
// Turbopack/webpack from failing on the missing dependency.
const noop = () => {
  throw new Error("Tempo Wallet is not supported in this app.");
};

export const Provider = { create: noop };
export const dialog = noop;
export const webAuthn = noop;
export const dangerous_secp256k1 = noop;

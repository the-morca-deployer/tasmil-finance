// Singleton cache for stellar-wallets-kit modules.
// Lives in its own module so cached references survive HMR updates to
// wallet-context.tsx in Turbopack dev mode - the dynamic import factory
// stays valid as long as this file isn't touched.

type KitSdk = typeof import("@creit.tech/stellar-wallets-kit/sdk");
type KitModulesUtils = typeof import("@creit.tech/stellar-wallets-kit/modules/utils");
type KitTypes = typeof import("@creit.tech/stellar-wallets-kit/types");

let sdk: KitSdk | undefined;
let modulesUtils: KitModulesUtils | undefined;
let types: KitTypes | undefined;

export async function getKitSdk(): Promise<KitSdk> {
  if (!sdk) sdk = await import("@creit.tech/stellar-wallets-kit/sdk");
  return sdk;
}

export async function getKitModulesUtils(): Promise<KitModulesUtils> {
  if (!modulesUtils) modulesUtils = await import("@creit.tech/stellar-wallets-kit/modules/utils");
  return modulesUtils;
}

export async function getKitTypes(): Promise<KitTypes> {
  if (!types) types = await import("@creit.tech/stellar-wallets-kit/types");
  return types;
}

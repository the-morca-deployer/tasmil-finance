import { keccak256, toBytes, type Hex } from "viem";

/**
 * Generate a deterministic private key from user's wallet signature
 * This ensures the same user always gets the same smart wallet
 */
export function generatePrivateKeyFromSignature(signature: string, userAddress: string): Hex {
  // Combine signature with user address for additional entropy
  const combined = `${signature}${userAddress}`;
  const hash = keccak256(toBytes(combined));
  return hash as Hex;
}

/**
 * Generate a random private key for demo purposes
 * In production, you should use generatePrivateKeyFromSignature
 */
export function generateRandomPrivateKey(): Hex {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  // Convert to hex string
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `0x${hex}` as Hex;
}

/**
 * Request user signature for smart wallet creation
 * This signature will be used to generate a deterministic private key
 */
export async function requestUserSignature(
  signMessage: (args: { message: string }) => Promise<string>,
  userAddress: string
): Promise<Hex> {
  const message = `Create smart wallet for ${userAddress}\n\nThis signature will be used to generate your smart wallet private key deterministically.`;
  
  try {
    const signature = await signMessage({ message });
    return generatePrivateKeyFromSignature(signature, userAddress);
  } catch (error) {
    console.error("Failed to get user signature:", error);
    throw new Error("User signature required for smart wallet creation");
  }
}

/**
 * Validate if a string is a valid private key
 */
export function isValidPrivateKey(key: string): boolean {
  if (!key.startsWith('0x')) return false;
  if (key.length !== 66) return false; // 0x + 64 hex characters
  
  const hexPart = key.slice(2);
  return /^[0-9a-fA-F]+$/.test(hexPart);
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
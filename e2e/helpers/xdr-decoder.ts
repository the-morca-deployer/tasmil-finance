/**
 * XDR decoder helper for validating Stellar transaction correctness.
 * Decodes unsigned XDR from execute cards to verify operations, amounts, destinations.
 */

interface DecodedOperation {
  type: string;
  source?: string;
  destination?: string;
  asset?: string;
  amount?: string;
  contractId?: string;
  functionName?: string;
}

interface DecodedTransaction {
  source: string;
  fee: string;
  operations: DecodedOperation[];
  network: string;
  raw: string;
}

/**
 * Basic XDR structure extraction without full SDK dependency.
 * For detailed validation, use @stellar/stellar-sdk in a Node context.
 *
 * This performs basic checks: is it valid base64, reasonable length, etc.
 */
export function validateXdr(xdr: string): { valid: boolean; error?: string } {
  if (!xdr || xdr.length < 50) {
    return { valid: false, error: "XDR too short or empty" };
  }

  // Check if it's valid base64
  try {
    const decoded = atob(xdr);
    if (decoded.length < 20) {
      return { valid: false, error: "Decoded XDR too short" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid base64 encoding" };
  }
}

/**
 * Extract the XDR string from a card's DOM content.
 * TX cards typically include the XDR in a hidden element or data attribute.
 */
export function extractXdrFromText(text: string): string | null {
  // Look for base64-encoded XDR (starts with AAAA for Stellar transactions)
  const xdrPattern = /AAAA[A-Za-z0-9+/=]{50,}/;
  const match = text.match(xdrPattern);
  return match?.[0] ?? null;
}

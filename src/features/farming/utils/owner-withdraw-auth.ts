import { Address, authorizeEntry, xdr } from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import { getSorobanClient } from "@/lib/stellar-client";
import { activeNetwork } from "@/shared/config/stellar";

/**
 * Sign KeeperWallet custom-account auth entries with the connected owner.
 *
 * Freighter's `signAuthEntry` returns the raw Ed25519 signature. Supplying the
 * owner's public key to `authorizeEntry` makes the Stellar SDK encode that
 * signature as the Vec<WalletSignature> expected by KeeperWallet::__check_auth,
 * even though the authorization address itself is the C... keeper contract.
 */
export async function signOwnerWithdrawAuth(xdrBase64: string, publicKey: string): Promise<string> {
  const envelope = xdr.TransactionEnvelope.fromXDR(xdrBase64, "base64");
  if (envelope.switch().name !== "envelopeTypeTx") {
    throw new Error("Owner withdrawal must use a standard transaction envelope");
  }

  const latestLedger = await getSorobanClient().getLatestLedger();
  const expirationLedger = latestLedger.sequence + 100;
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
  let signedCount = 0;

  for (const operation of envelope.v1().tx().operations()) {
    const body = operation.body();
    if (body.switch().name !== "invokeHostFunction") continue;

    const invocation = body.invokeHostFunctionOp();
    const authEntries = invocation.auth?.() ?? [];
    const signedEntries: xdr.SorobanAuthorizationEntry[] = [];

    for (const entry of authEntries) {
      if (entry.credentials().switch().name !== "sorobanCredentialsAddress") {
        signedEntries.push(entry);
        continue;
      }

      const authAddress = Address.fromScAddress(entry.credentials().address().address()).toString();
      if (!authAddress.startsWith("C")) {
        signedEntries.push(entry);
        continue;
      }

      const signedEntry = await authorizeEntry(
        entry,
        async (preimage) => {
          const { signedAuthEntry, signerAddress } = await StellarWalletsKit.signAuthEntry(
            preimage.toXDR("base64"),
            {
              address: publicKey,
              networkPassphrase: activeNetwork.networkPassphrase,
            }
          );
          if (!signedAuthEntry) throw new Error("Wallet did not return an authorization signature");
          if (signerAddress && signerAddress !== publicKey) {
            throw new Error("Wallet signed with a different account");
          }
          return {
            publicKey,
            signature: Buffer.from(signedAuthEntry, "base64"),
          };
        },
        expirationLedger,
        activeNetwork.networkPassphrase
      );
      signedEntries.push(signedEntry);
      signedCount += 1;
    }

    invocation.auth(signedEntries);
  }

  if (signedCount === 0) {
    throw new Error("Withdrawal transaction has no KeeperWallet authorization to sign");
  }
  return envelope.toXDR("base64");
}

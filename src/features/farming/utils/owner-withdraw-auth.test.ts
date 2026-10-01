/** @jest-environment node */

import {
  Account,
  Address,
  hash,
  Keypair,
  Networks,
  nativeToScVal,
  Operation,
  StrKey,
  scValToNative,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { signOwnerWithdrawAuth } from "./owner-withdraw-auth";

const signAuthEntryMock = jest.fn();

jest.mock("@creit.tech/stellar-wallets-kit/sdk", () => ({
  StellarWalletsKit: { signAuthEntry: signAuthEntryMock },
}));

jest.mock("@/lib/stellar-client", () => ({
  getSorobanClient: () => ({
    getLatestLedger: jest.fn().mockResolvedValue({ sequence: 1_000_000 }),
  }),
}));

function unsignedKeeperWithdraw(ownerPublicKey: string, keeper: string, strategy: string): string {
  const invocation = new xdr.InvokeContractArgs({
    contractAddress: new Address(strategy).toScAddress(),
    functionName: "withdraw",
    args: [
      nativeToScVal(1n, { type: "i128" }),
      new Address(keeper).toScVal(),
      new Address(ownerPublicKey).toScVal(),
    ],
  });
  const auth = new xdr.SorobanAuthorizationEntry({
    credentials: xdr.SorobanCredentials.sorobanCredentialsAddress(
      new xdr.SorobanAddressCredentials({
        address: new Address(keeper).toScAddress(),
        nonce: xdr.Int64.fromString("1"),
        signatureExpirationLedger: 0,
        signature: xdr.ScVal.scvVoid(),
      })
    ),
    rootInvocation: new xdr.SorobanAuthorizedInvocation({
      function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(invocation),
      subInvocations: [],
    }),
  });

  return new TransactionBuilder(new Account(ownerPublicKey, "1"), {
    fee: "100",
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(invocation),
        auth: [auth],
      })
    )
    .setTimeout(30)
    .build()
    .toXDR();
}

describe("signOwnerWithdrawAuth", () => {
  it("wraps the owner's Freighter signature in KeeperWallet's signature schema", async () => {
    const owner = Keypair.fromRawEd25519Seed(
      Buffer.from(Array.from({ length: 32 }, (_, i) => i + 1))
    );
    const keeper = StrKey.encodeContract(Buffer.alloc(32, 7));
    const strategy = StrKey.encodeContract(Buffer.alloc(32, 8));
    signAuthEntryMock.mockImplementation(async (preimageXdr: string) => ({
      signedAuthEntry: owner.sign(hash(Buffer.from(preimageXdr, "base64"))).toString("base64"),
      signerAddress: owner.publicKey(),
    }));

    const result = await signOwnerWithdrawAuth(
      unsignedKeeperWithdraw(owner.publicKey(), keeper, strategy),
      owner.publicKey()
    );
    const transaction = TransactionBuilder.fromXDR(result, Networks.PUBLIC);
    if ("innerTransaction" in transaction) throw new Error("unexpected fee bump");
    const operation = transaction.operations[0];
    if (!operation || operation.type !== "invokeHostFunction") {
      throw new Error("unexpected operation");
    }

    const authEntry = operation.auth?.[0];
    if (!authEntry) throw new Error("missing keeper authorization");
    const credential = authEntry.credentials().address();
    const signatures = scValToNative(credential.signature()) as Array<{
      public_key: Buffer;
      signature: Buffer;
    }>;
    const walletSignature = signatures[0];
    if (!walletSignature) throw new Error("missing owner signature");

    expect(credential.signatureExpirationLedger()).toBe(1_000_100);
    expect(Buffer.from(walletSignature.public_key)).toEqual(owner.rawPublicKey());
    expect(Buffer.from(walletSignature.signature)).toHaveLength(64);
    expect(signAuthEntryMock).toHaveBeenCalledTimes(1);
  });
});
